import type { PrismaClient, User, RefreshToken } from '@prisma/client';

/**
 * Data-access for authentication.
 * The ONLY layer that talks to Prisma for users + refresh tokens.
 */
export class AuthRepository {
  constructor(private readonly db: PrismaClient) {}

  // ─── Users ────────────────────────────────────────────────────

  async findUserByEmail(email: string): Promise<(User & { role: { name: string } }) | null> {
    return this.db.user.findUnique({
      where: { email },
      include: { role: { select: { name: true } } },
    });
  }

  async findUserById(id: string): Promise<(User & { role: { name: string } }) | null> {
    return this.db.user.findUnique({
      where: { id },
      include: { role: { select: { name: true } } },
    });
  }

  async createUser(data: {
    email: string;
    passwordHash: string;
    fullName: string;
    roleId: string;
  }): Promise<User & { role: { name: string } }> {
    return this.db.user.create({
      data,
      include: { role: { select: { name: true } } },
    });
  }

  async findRoleByName(name: string): Promise<{ id: string; name: string } | null> {
    return this.db.role.findUnique({ where: { name: name as never } });
  }

  // ─── Refresh Tokens ───────────────────────────────────────────

  async createRefreshToken(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<RefreshToken> {
    return this.db.refreshToken.create({ data });
  }

  async findRefreshToken(tokenHash: string): Promise<RefreshToken | null> {
    return this.db.refreshToken.findUnique({ where: { tokenHash } });
  }

  async revokeRefreshToken(tokenHash: string): Promise<void> {
    await this.db.refreshToken.updateMany({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    await this.db.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async deleteExpiredTokens(): Promise<void> {
    await this.db.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }
}