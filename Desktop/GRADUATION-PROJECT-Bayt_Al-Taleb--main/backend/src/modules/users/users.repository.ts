import type { PrismaClient, User, Role } from '@prisma/client';
import type { UpdateUserData } from './users.types.js';

export type UserWithRole = User & { role: Role };

export class UsersRepository {
  constructor(private readonly db: PrismaClient) {}

  async findAll(opts: {
    page: number;
    limit: number;
    search?: string;
    role?: string;
  }): Promise<{ items: UserWithRole[]; total: number }> {
    const skip = (opts.page - 1) * opts.limit;

    const where = {
      ...(opts.search
        ? {
            OR: [
              { email:    { contains: opts.search, mode: 'insensitive' as const } },
              { fullName: { contains: opts.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
      ...(opts.role ? { role: { name: opts.role as never } } : {}),
    };

    const [items, total] = await Promise.all([
      this.db.user.findMany({
        where,
        include: { role: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: opts.limit,
      }),
      this.db.user.count({ where }),
    ]);

    return { items, total };
  }

  async findById(id: string): Promise<UserWithRole | null> {
    return this.db.user.findUnique({
      where: { id },
      include: { role: true },
    });
  }

  async findByEmail(email: string): Promise<UserWithRole | null> {
    return this.db.user.findUnique({
      where: { email },
      include: { role: true },
    });
  }

  async create(data: {
    email: string;
    passwordHash: string;
    fullName: string;
    roleId: string;
  }): Promise<UserWithRole> {
    return this.db.user.create({
      data,
      include: { role: true },
    });
  }

  async update(id: string, data: UpdateUserData): Promise<UserWithRole> {
    return this.db.user.update({
      where: { id },
      data,
      include: { role: true },
    });
  }

  async delete(id: string): Promise<void> {
    await this.db.user.delete({ where: { id } });
  }
}