import { PrismaClient, RoleName } from '@prisma/client';
import { ROLE_PERMISSIONS, ALL_PERMISSIONS } from '../src/shared/rbac/permissions.js';
import bcrypt from 'bcryptjs';

/**
 * Seeds the canonical roles and their permission grants.
 * Idempotent: safe to run repeatedly (upserts everything).
 *
 *   npx prisma db seed
 */
const prisma = new PrismaClient();

async function main() {
  // 1. Upsert every permission key.
  for (const key of ALL_PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key },
      update: {},
      create: { key },
    });
  }

  // 2. Upsert each role and wire its permissions.
  for (const roleName of Object.values(RoleName)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });

    const grantedKeys = ROLE_PERMISSIONS[roleName] ?? [];
    for (const key of grantedKeys) {
      const permission = await prisma.permission.findUniqueOrThrow({ where: { key } });
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }
  }

  // 3. Seed default admin users
  const defaultUsers = [
    {
      email: 'superadmin@bayt.com',
      password: 'SuperAdmin@123',
      fullName: 'Super Admin',
      roleName: RoleName.SUPER_ADMIN,
    },
    {
      email: 'admin@bayt.com',
      password: 'Admin@123',
      fullName: 'Admin',
      roleName: RoleName.ADMIN,
    },
    {
      email: 'moderator@bayt.com',
      password: 'Moderator@123',
      fullName: 'Moderator',
      roleName: RoleName.MODERATOR,
    },
  ];

  for (const u of defaultUsers) {
    const role = await prisma.role.findUniqueOrThrow({ where: { name: u.roleName } });
    const passwordHash = await bcrypt.hash(u.password, 12);
    await prisma.user.upsert({
      where: { email: u.email },
      // FIXED: Now it actually updates the name and password if the user exists!
      update: {
        fullName: u.fullName,
        passwordHash,
      },
      create: { email: u.email, passwordHash, fullName: u.fullName, roleId: role.id },
    });
  }

  console.log('✅ Seed complete: roles, permissions & default users provisioned.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
