import type { PrismaClient, Role, RoleName } from '@prisma/client';

export class RolesRepository {
  constructor(private readonly db: PrismaClient) {}

  async findAll(): Promise<Role[]> {
    return this.db.role.findMany({ orderBy: { name: 'asc' } });
  }

  async findByName(name: RoleName): Promise<Role | null> {
    return this.db.role.findUnique({ where: { name } });
  }

  async assignRoleToUser(userId: string, roleId: string): Promise<void> {
    await this.db.user.update({
      where: { id: userId },
      data: { roleId },
    });
  }

  async findUserById(userId: string): Promise<{ id: string } | null> {
    return this.db.user.findUnique({ where: { id: userId }, select: { id: true } });
  }
}