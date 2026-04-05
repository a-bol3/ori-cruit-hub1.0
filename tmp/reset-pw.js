const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  const hash = await bcrypt.hash('admin123', 10);
  await prisma.user.update({
    where: { email: 'admin@oricruit.com' },
    data: { password: hash },
  });
  console.log('✅ Password updated to admin123');
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
