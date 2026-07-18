import { supabase } from '@/lib/supabase';

export interface Contact {
  id: string;
  fullName: string;
  role: string;
  avatarUrl?: string;
  unreadCount?: number;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender?: {
    fullName: string;
    avatarUrl: string;
  };
}

export async function getContacts(userId: string, role: string): Promise<Contact[]> {
  // If Admin: fetch all trainers and trainees (or everyone)
  // For now, let's fetch everyone who has interacted or is active,
  // or just all users for admin. But wait, returning all users could be huge.
  // Instead, let's use an RPC or just let them search.
  // For MVP:
  // Trainee: Fetch Admin + their Trainers
  // Trainer: Fetch Admin + their Trainees

  const allowedUserIds = new Set<string>();

  // Fetch admin(s)
  const { data: admins } = await supabase.from('User').select('id, fullName, role, avatarUrl').eq('role', 'ADMIN');
  const adminIds = admins?.map((a) => a.id) || [];

  if (role === 'TRAINEE') {
    const { data: enrolments } = await supabase
      .from('Enrolment')
      .select('trainer:Trainer!trainerId(userId)')
      .eq('traineeId', userId);

    enrolments?.forEach((e: any) => {
      if (e.trainer?.userId) allowedUserIds.add(e.trainer.userId);
    });
  } else if (role === 'TRAINER') {
    const { data: trainerData } = await supabase.from('Trainer').select('id').eq('userId', userId).single();
    if (trainerData) {
      const { data: enrolments } = await supabase.from('Enrolment').select('traineeId').eq('trainerId', trainerData.id);

      enrolments?.forEach((e: any) => allowedUserIds.add(e.traineeId));
    }
  }

  // Admin can see anyone they have messages with, plus we can just load a list of users they've messaged.
  if (role === 'ADMIN') {
    // Admin gets recent contacts from Message table
    const { data: messages } = await supabase
      .from('Message')
      .select('senderId, receiverId')
      .or(`senderId.eq.${userId},receiverId.eq.${userId}`);

    messages?.forEach((m: any) => {
      if (m.senderId !== userId) allowedUserIds.add(m.senderId);
      if (m.receiverId !== userId) allowedUserIds.add(m.receiverId);
    });
  } else {
    adminIds.forEach((id) => allowedUserIds.add(id));
  }

  // Ensure we don't include ourselves
  allowedUserIds.delete(userId);

  if (allowedUserIds.size === 0) return [];

  const { data: contacts, error } = await supabase
    .from('User')
    .select('id, fullName, role, avatarUrl')
    .in('id', Array.from(allowedUserIds));

  if (error) throw error;

  // Count manually per sender
  const { data: allUnread } = await supabase
    .from('Message')
    .select('senderId')
    .eq('receiverId', userId)
    .eq('isRead', false);

  const unreadMap: Record<string, number> = {};
  allUnread?.forEach((msg) => {
    unreadMap[msg.senderId] = (unreadMap[msg.senderId] || 0) + 1;
  });

  return (contacts || []).map((c) => ({
    ...c,
    unreadCount: unreadMap[c.id] || 0,
  }));
}

export async function getMessages(userId: string, contactId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('Message')
    .select('*, sender:User!senderId(fullName, avatarUrl)')
    .or(`and(senderId.eq.${userId},receiverId.eq.${contactId}),and(senderId.eq.${contactId},receiverId.eq.${userId})`)
    .order('createdAt', { ascending: true });

  if (error) throw error;
  return data as Message[];
}

export async function sendMessage(senderId: string, receiverId: string, content: string) {
  const { data, error } = await supabase
    .from('Message')
    .insert({ senderId, receiverId, content })
    .select('*, sender:User!senderId(fullName, avatarUrl)')
    .single();

  if (error) throw error;
  return data;
}

export async function markAsRead(userId: string, senderId: string) {
  const { error } = await supabase
    .from('Message')
    .update({ isRead: true })
    .eq('receiverId', userId)
    .eq('senderId', senderId)
    .eq('isRead', false);

  if (error) throw error;
}
