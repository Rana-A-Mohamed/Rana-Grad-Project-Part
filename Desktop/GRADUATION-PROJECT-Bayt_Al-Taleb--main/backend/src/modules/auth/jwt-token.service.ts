import jwt from 'jsonwebtoken';
import type { TokenService, AccessTokenPayload, RefreshTokenPayload } from './auth.types.js';
import { UnauthorizedError } from '../../shared/errors/app-error.js';

export interface JwtConfig {
  accessSecret: string;
  refreshSecret: string;
  accessExpiresIn: string;
  refreshExpiresIn: string;
}

export class JwtTokenService implements TokenService {
  constructor(private readonly config: JwtConfig) {}

  signAccess(payload: Omit<AccessTokenPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, this.config.accessSecret, {
      expiresIn: this.config.accessExpiresIn as jwt.SignOptions['expiresIn'],
    });
  }

  signRefresh(payload: Omit<RefreshTokenPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, this.config.refreshSecret, {
      expiresIn: this.config.refreshExpiresIn as jwt.SignOptions['expiresIn'],
    });
  }

  verifyAccess(token: string): AccessTokenPayload {
    try {
      return jwt.verify(token, this.config.accessSecret) as AccessTokenPayload;
    } catch {
      throw new UnauthorizedError('Invalid or expired access token');
    }
  }
  verifyAccessToken(token: string): AccessTokenPayload {
    return this.verifyAccess(token);
  }
  verifyRefresh(token: string): RefreshTokenPayload {
    try {
      return jwt.verify(token, this.config.refreshSecret) as RefreshTokenPayload;
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
  }
}