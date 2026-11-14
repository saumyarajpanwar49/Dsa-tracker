require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || 'Administrator';

  if (!email || !password || password.length < 12) {
    throw new Error(
      'Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 12 characters) in backend/.env'
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      role: 'ADMIN',
      isActive: true,
    },
    create: {
      name,
      email,
      passwordHash,
      role: 'ADMIN',
    },
  });

  const problems = await prisma.problem.updateMany({
    where: { userId: null },
    data: { userId: admin.id },
  });

  const customTopics = await prisma.customTopic.updateMany({
    where: { userId: null },
    data: { userId: admin.id },
  });

  const deletedTopics = await prisma.deletedTopic.updateMany({
    where: { userId: null },
    data: { userId: admin.id },
  });

  console.log('Administrator ready:', admin.email);
  console.log('Existing problems assigned:', problems.count);
  console.log('Existing custom topics assigned:', customTopics.count);
  console.log('Existing deleted topics assigned:', deletedTopics.count);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });