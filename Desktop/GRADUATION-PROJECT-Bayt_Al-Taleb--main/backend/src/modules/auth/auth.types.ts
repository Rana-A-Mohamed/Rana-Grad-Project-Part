/** Domain types & service interfaces for the Auth module. */

// ─── Token Payloads ──────────────────────────────────────────────

export interface AccessTokenPayload {
  sub: string;       // userId
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  sub: string;       // userId
  jti: string;       // unique token id — SHA-256 of the signed token is stored
  iat?: number;
  exp?: number;
}

// ─── Value Objects ───────────────────────────────────────────────

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// ─── Service Interfaces (ports) ──────────────────────────────────

/**
 * Abstraction over JWT signing/verification. Implemented by JwtTokenService.
 * Injected into AuthService so tests can use a fake.
 */
export interface TokenService {
  signAccess(payload: Omit<AccessTokenPayload, 'iat' | 'exp'>): string;
  signRefresh(payload: Omit<RefreshTokenPayload, 'iat' | 'exp'>): string;
  verifyAccess(token: string): AccessTokenPayload;
  verifyAccessToken(token: string): AccessTokenPayload;  
  verifyRefresh(token: string): RefreshTokenPayload;
}

/**
 * Abstraction over password hashing. Implemented by BcryptPasswordHasher.
 */
export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  compare(plain: string, hash: string): Promise<boolean>;
}

// ─── Result ──────────────────────────────────────────────────────

export interface AuthResult {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
  tokens: TokenPair;
}
