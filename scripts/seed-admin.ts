import bcrypt from 'bcryptjs';

// We need to import db properly for a standalone script
// Using dynamic import since this script runs with bun directly

async function main() {
  // Dynamically import the db client
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

    // Update role if not admin
    if (existing.role !== adminRole) {
      await db.user.update({
        where: { id: existing.id },
        data: { role: adminRole },
      });
      console.log('   ✅ Updated role to admin');
    }

    await db.$disconnect();
    return;
  }

  // Hash the password
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(adminPassword, salt);

  // Create admin user
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
