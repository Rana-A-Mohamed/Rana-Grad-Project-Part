import crypto from 'crypto';
import type { AuthRepository } from './auth.repository.js';
import type { TokenService, PasswordHasher, AuthResult, RefreshTokenPayload } from './auth.types.js';
import type { RegisterInput, LoginInput, RefreshInput, LogoutInput } from './auth.validation.js';
import { ConflictError, UnauthorizedError } from '../../shared/errors/app-error.js';
import { RoleName } from '@prisma/client';

/**
 * AuthService — owns ALL authentication business logic.
 *
 * Refresh-token strategy:
 *   - Sign a JWT whose `jti` is a random UUID.
 *   - Persist only SHA-256(signedToken) in the DB.
 *   - On refresh: verify JWT → look up hash → check not revoked/expired →
 *     revoke old → issue new pair. Enables server-side logout & theft detection.
 */
export class AuthService {
  constructor(
    private readonly repo: AuthRepository,
    private readonly hasher: PasswordHasher,
    private readonly tokenService: TokenService,
    private readonly refreshTtlMs: number,   // e.g. 7 * 24 * 60 * 60 * 1000
  ) {}

  // ─── Register ────────────────────────────────────────────────

  async register(input: RegisterInput): Promise<AuthResult> {
    const existing = await this.repo.findUserByEmail(input.email);
    if (existing) {
      throw new ConflictError('Email is already in use');
    }

    const memberRole = await this.repo.findRoleByName(RoleName.MEMBER);
    if (!memberRole) throw new Error('MEMBER role not seeded');

    const passwordHash = await this.hasher.hash(input.password);

    const user = await this.repo.createUser({
      email: input.email,
      passwordHash,
      fullName: input.fullName,
      roleId: memberRole.id,
    });

    const tokens = await this.#issueTokenPair(user.id, user.email, user.role.name);

    return {
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role.name },
      tokens,
    };
  }

  // ─── Login ───────────────────────────────────────────────────

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await this.repo.findUserByEmail(input.email);
    if (!user) throw new UnauthorizedError('Invalid email or password');

    const valid = await this.hasher.compare(input.password, user.passwordHash);
    if (!valid) throw new UnauthorizedError('Invalid email or password');

    if (!user.isActive) throw new UnauthorizedError('Account is deactivated');

    const tokens = await this.#issueTokenPair(user.id, user.email, user.role.name);

    return {
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role.name },
      tokens,
    };
  }

  // ─── Refresh ─────────────────────────────────────────────────

  async refresh(input: RefreshInput): Promise<AuthResult> {
    let payload: RefreshTokenPayload;
    try {
      payload = this.tokenService.verifyRefresh(input.refreshToken);
    } catch {
      throw new UnauthorizedError('Invalid refresh token');
    }

    const tokenHash = this.#hashToken(input.refreshToken);
    const stored = await this.repo.findRefreshToken(tokenHash);

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedError('Refresh token is invalid or expired');
    }

    // Rotate: revoke old, issue new
    await this.repo.revokeRefreshToken(tokenHash);

    const user = await this.repo.findUserById(payload.sub);
    if (!user || !user.isActive) throw new UnauthorizedError('User not found or deactivated');

    const tokens = await this.#issueTokenPair(user.id, user.email, user.role.name);

    return {
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role.name },
      tokens,
    };
  }

  // ─── Logout ──────────────────────────────────────────────────

  async logout(input: LogoutInput): Promise<void> {
    const tokenHash = this.#hashToken(input.refreshToken);
    await this.repo.revokeRefreshToken(tokenHash);
  }

  // ─── Private Helpers ─────────────────────────────────────────

  async #issueTokenPair(userId: string, email: string, role: string) {
    const jti = crypto.randomUUID();

    const accessToken  = this.tokenService.signAccess({ sub: userId, email, role });
    const refreshToken = this.tokenService.signRefresh({ sub: userId, jti });

    const tokenHash = this.#hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + this.refreshTtlMs);

    await this.repo.createRefreshToken({ userId, tokenHash, expiresAt });

    return { accessToken, refreshToken };
  }

  #hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}