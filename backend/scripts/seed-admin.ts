// Creates (or resets the password of) the super admin from SUPER_ADMIN_EMAIL /
// SUPER_ADMIN_PASSWORD. Usage: npm run seed:admin
import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '../generated/central';

async function main() {
  if (process.env.DEPLOYMENT_MODE === 'onprem') {
    console.log('On-prem installs have no super admin; nothing to do.');
    return;
  }
  const email = process.env.SUPER_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SUPER_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error('SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD must be set');
  }
  if (password.length < 8) {
    throw new Error('SUPER_ADMIN_PASSWORD must be at least 8 characters');
  }

  const prisma = new PrismaClient({
    datasourceUrl: process.env.CENTRAL_DATABASE_URL,
  });
  try {
    const hash = await bcrypt.hash(password, 10);
    const admin = await prisma.superAdmin.upsert({
      where: { email },
      create: { email, password: hash },
      update: { password: hash },
    });
    console.log(`Super admin ready: ${admin.email}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
