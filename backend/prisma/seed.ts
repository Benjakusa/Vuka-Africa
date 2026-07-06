import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('Admin@Vuka2026!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@vuka.africa' },
    update: {},
    create: {
      email: 'admin@vuka.africa',
      phone: '+254700000000',
      fullName: 'Vuka Admin',
      role: UserRole.ADMIN,
      passwordHash: adminPassword,
      emailVerified: true,
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
