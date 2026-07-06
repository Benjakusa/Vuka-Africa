import { createAdminClient } from '@/lib/supabase/admin';
import { mpesaClient } from '@backend/lib/mpesa';
import { ConflictError, NotFoundError, ValidationError } from '@backend/lib/errors';
import { checkAndMarkIdempotent } from '@backend/lib/idempotency';
import { CACHE } from '@backend/lib/config';

interface CreateEnrolmentInput {
  traineeId: string;
  courseId: string;
}

const db = () => createAdminClient();

export async function createEnrolment(input: CreateEnrolmentInput) {
  const { data: course } = await db()
    .from('Course')
    .select(`*, trainer:Trainer(userId, commissionRate, id)`)
    .eq('id', input.courseId)
    .is('deletedAt', null)
    .single();

  if (!course) throw new NotFoundError('Course');
  if (!course.isPublished) throw new ValidationError('Course is not published');
  if (course.trainer.userId === input.traineeId) {
    throw new ValidationError('Cannot enrol in your own course');
  }

  const { count: enrolmentCount } = await db()
    .from('Enrolment')
    .select('*', { count: 'exact', head: true })
    .eq('courseId', input.courseId);

  if (course.maxStudents && (enrolmentCount || 0) >= course.maxStudents) {
    throw new ValidationError('Course is full');
  }

  const { data: existing } = await db()
    .from('Enrolment')
    .select('id')
    .eq('traineeId', input.traineeId)
    .eq('courseId', input.courseId)
    .in('status', ['PENDING_PAYMENT', 'ACTIVE'])
    .maybeSingle();

  if (existing) throw new ConflictError('Already enrolled in this course');

  const { data: user } = await db()
    .from('User')
    .select('id, phone')
    .eq('id', input.traineeId)
    .single();
  if (!user) throw new NotFoundError('User');

  const idempotent = await checkAndMarkIdempotent('enrolment', `${input.courseId}:${input.traineeId}`, CACHE.IDEMPOTENCY_TTL);
  if (idempotent) {
    throw new ConflictError('Duplicate enrolment request. Please wait for M-Pesa prompt.');
  }

  const pricePaidKes = Number(course.priceKes);
  const commissionKes = (pricePaidKes * Number(course.trainer.commissionRate)) / 100;
  const trainerPayoutKes = pricePaidKes - commissionKes;

  let enrolment: any;

  try {
    const { data: created, error: createError } = await db()
      .from('Enrolment')
      .insert({
        courseId: input.courseId,
        traineeId: input.traineeId,
        trainerId: course.trainer.id,
        status: 'PENDING_PAYMENT',
        pricePaidKes,
        commissionKes,
        trainerPayoutKes,
      })
      .select()
      .single();

    if (createError || !created) throw new Error('Failed to create enrolment');
    enrolment = created;

    const response = await mpesaClient.stkPush({
      phone: user.phone,
      amount: pricePaidKes,
      accountReference: `ENROL-${enrolment.id}`,
      transactionDesc: `Vuka Course Enrolment`,
    });

    await db()
      .from('Enrolment')
      .update({ mpesaCheckoutRequestId: response.CheckoutRequestID })
      .eq('id', enrolment.id);

    return {
      enrolmentId: enrolment.id,
      checkoutRequestID: response.CheckoutRequestID,
    };
  } catch (error: any) {
    if (enrolment) {
      await db().from('Enrolment').delete().eq('id', enrolment.id);
    }
    throw error;
  }
}

export async function getEnrolmentStatus(enrolmentId: string, userId: string) {
  const { data: enrolment } = await db()
    .from('Enrolment')
    .select('id, status, mpesaCheckoutRequestId, mpesaTransactionId, pricePaidKes, startedAt, createdAt, traineeId')
    .eq('id', enrolmentId)
    .single();

  if (!enrolment) throw new NotFoundError('Enrolment');
  if (enrolment.traineeId !== userId) throw new NotFoundError('Enrolment');

  return enrolment;
}

export async function getEnrolmentDetail(enrolmentId: string, userId: string) {
  const { data: enrolment, error } = await db()
    .from('Enrolment')
    .select(`
      *,
      course:Course(
        *,
        trainer:Trainer(
          id,
          user:User(fullName, avatarUrl)
        )
      ),
      trainee:User(id, fullName, avatarUrl, email, phone),
      milestones:Milestone(*)
    `)
    .eq('id', enrolmentId)
    .order('sequence', { referencedTable: 'milestones', ascending: true })
    .single();

  if (!enrolment) throw new NotFoundError('Enrolment');

  if (enrolment.traineeId !== userId && enrolment.course?.trainer?.userId !== userId) {
    const { data: admin } = await db()
      .from('User')
      .select('role')
      .eq('id', userId)
      .single();
    if (!admin || admin.role !== 'ADMIN') {
      throw new ValidationError('Not authorized to view this enrolment');
    }
  }

  return enrolment;
}

export async function listUserEnrolments(
  userId: string,
  role: 'TRAINEE' | 'TRAINER',
  status?: string,
  page = 1,
  perPage = 20
) {
  let query = db()
    .from('Enrolment')
    .select(`
      *,
      course:Course(title, slug, imageUrl, mode),
      trainee:User(id, fullName, avatarUrl),
      milestones:Milestone(status, sequence)
    `, { count: 'exact' })
    .order('createdAt', { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1)
    .order('sequence', { referencedTable: 'milestones', ascending: true });

  if (role === 'TRAINEE') {
    query = query.eq('traineeId', userId);
  } else {
    query = query.eq('trainer.userId', userId);
  }

  if (status) {
    query = query.eq('status', status);
  }

  const { data: enrolments, count: total, error } = await query;

  if (error) throw new Error('Failed to list enrolments');

  return {
    data: enrolments || [],
    meta: { page, perPage, total: total || 0, totalPages: Math.ceil((total || 0) / perPage) },
  };
}
