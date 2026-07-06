import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function main() {
  let supabaseUserId: string;

  // Create admin user in Supabase
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
    body: JSON.stringify({
      email: 'admin@vuka.africa',
      password: 'Admin@Vuka2026!',
      email_confirm: true,
    }),
  });

  if (res.ok) {
    const data = await res.json();
    supabaseUserId = data.id;
  } else {
    // User may already exist in Supabase; try getting by email
    const list = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?email=admin@vuka.africa`, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    });
    const users = await list.json();
    const existing = Array.isArray(users) ? users.find((u: any) => u.email === 'admin@vuka.africa') : null;
    supabaseUserId = existing?.id;
    if (!supabaseUserId) {
      console.error('Could not create or find Supabase admin user');
      process.exit(1);
    }
  }

  const admin = await prisma.user.upsert({
    where: { email: 'admin@vuka.africa' },
    update: {},
    create: {
      id: supabaseUserId,
      email: 'admin@vuka.africa',
      phone: '+254700000000',
      fullName: 'Vuka Admin',
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  console.log(`Admin created: ${admin.id}`);

  await prisma.platformConfig.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      trainerCount: 0,
      freeTrainerLimit: 100,
    },
  });

  console.log('PlatformConfig seeded');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
