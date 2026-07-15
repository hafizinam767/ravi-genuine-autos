import crypto from 'crypto';

const SALT_LENGTH = 16;
const KEY_LENGTH = 64;

function hashPasswordSync(password: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
  const key = crypto.scryptSync(password, salt, KEY_LENGTH);
  return `${salt}:${key.toString('hex')}`;
}

async function main() {
  const { db } = await import('../src/lib/db');

  const adminEmail = 'admin@ravigenuineautos.com';
  const adminPassword = 'admin123';
  const adminRole = 'admin';

  console.log('🌱 Seeding admin user...');

  // Check if admin already exists
  const existing = await db.user.findUnique({
    where: { email: adminEmail },
  });

  if (existing) {
    console.log(`⚠️  Admin user already exists: ${adminEmail}`);
    console.log(`   User ID: ${existing.id}`);
    console.log(`   Role: ${existing.role}`);

    const hashedPassword = hashPasswordSync(adminPassword);

    const updateData: { role?: string; password?: string; name?: string; email?: string } = {};

    if (existing.role !== adminRole) updateData.role = adminRole;
    if (existing.password !== hashedPassword) updateData.password = hashedPassword;

    if (Object.keys(updateData).length > 0) {
      await db.user.update({
        where: { id: existing.id },
        data: updateData,
      });
      console.log('   ✅ Updated admin credentials for the simplified deployment flow');
    }

    await db.$disconnect();
    return;
  }

  const hashedPassword = hashPasswordSync(adminPassword);

  const admin = await db.user.create({
    data: {
      name: 'Admin',
      email: adminEmail,
      password: hashedPassword,
      role: adminRole,
      emailVerified: true,
    },
  });

  console.log('✅ Admin user created successfully!');
  console.log(`   Email: ${admin.email}`);
  console.log(`   Password: ${adminPassword}`);
  console.log(`   Role: ${admin.role}`);
  console.log(`   User ID: ${admin.id}`);

  await db.$disconnect();
}

main().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});
