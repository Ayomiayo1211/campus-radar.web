const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash(
    'ChangeThisPassword123!',
    12
  );

  const user = await prisma.user.upsert({
    where: {
      email: 'admin@campusradar.ng',
    },
    update: {
      passwordHash,
      role: 'SUPER_ADMIN',
    },
    create: {
      name: 'Campus Radar Admin',
      email: 'admin@campusradar.ng',
      passwordHash,
      role: 'SUPER_ADMIN',
    },
  });

  console.log('Admin user ready:', user.email);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });