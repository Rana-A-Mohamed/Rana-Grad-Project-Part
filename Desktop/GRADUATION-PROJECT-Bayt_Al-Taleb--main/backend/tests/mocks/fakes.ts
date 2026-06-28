import { vi } from 'vitest';
import type { RoleName } from '@prisma/client';
import type {
  AccessTokenPayload,
  PasswordHasher,
  RefreshTokenPayload,
  TokenService,
} from '../../src/modules/auth/auth.types.js';

/**
 * Test doubles for the cross-cutting auth abstractions. Because services depend
 * on the PasswordHasher / TokenService INTERFACES (not bcrypt / jsonwebtoken),
 * we can swap in these deterministic fakes — no crypto, no real signing.
 */

/** A trivially reversible "hasher": hash(x) = `hashed:${x}`. */
export class FakePasswordHasher implements PasswordHasher {
  async hash(plain: string): Promise<string> {
    return `hashed:${plain}`;
  }
  async compare(plain: string, hash: string): Promise<boolean> {
    return hash === `hashed:${plain}`;
  }
}

/** Encodes payloads as JSON strings; "verifies" by parsing them back. */
export class FakeTokenService implements TokenService {
  signAccessToken(payload: AccessTokenPayload): string {
    return `access.${JSON.stringify(payload)}`;
  }
  signRefreshToken(payload: RefreshTokenPayload): string {
    return `refresh.${JSON.stringify(payload)}`;
  }
  verifyAccessToken(token: string): AccessTokenPayload {
    if (!token.startsWith('access.')) throw new Error('invalid');
    return JSON.parse(token.slice('access.'.length)) as AccessTokenPayload;
  }
  verifyRefreshToken(token: string): RefreshTokenPayload {
    if (!token.startsWith('refresh.')) throw new Error('invalid');
    return JSON.parse(token.slice('refresh.'.length)) as RefreshTokenPayload;
  }
}

/** Build a typed mock of any class/interface; all methods are vi.fn(). */
export function mockOf<T>(overrides: Partial<Record<keyof T, unknown>> = {}): T {
  return new Proxy(
    {},
    {
      get(target: Record<string, unknown>, prop: string) {
        if (prop in overrides) return overrides[prop as keyof T];
        if (!(prop in target)) target[prop] = vi.fn();
        return target[prop];
      },
    },
  ) as T;
}

export const SAMPLE_ROLE: RoleName = 'MEMBER';

// ── Authorization test helpers ──────────────────────────────────────
import { RoleName as Role } from '@prisma/client';
import { AuthorizationService } from '../../src/modules/authorization/authorization.service.js';
import type { AssignmentReader, Actor } from '../../src/modules/authorization/authorization.types.js';

/** Canonical actors used across authorization tests. */
export const ADMIN_ACTOR: Actor = { id: 'admin_1', role: Role.ADMIN };
export const SUPER_ADMIN_ACTOR: Actor = { id: 'sa_1', role: Role.SUPER_ADMIN };
export const MODERATOR_ACTOR: Actor = { id: 'mod_1', role: Role.MODERATOR };
export const MEMBER_ACTOR: Actor = { id: 'mem_1', role: Role.MEMBER };

import { AuditService } from '../../src/modules/audit/audit.service.js';
import type { AuditRepository } from '../../src/modules/audit/audit.repository.js';
import type {
  StorageProvider,
  StoredFile,
} from '../../src/infrastructure/storage/storage.provider.js';
import { NotificationService } from '../../src/modules/notifications/notifications.service.js';
import type { NotificationsRepository } from '../../src/modules/notifications/notifications.repository.js';

/**
 * A real NotificationService over a stub repository (no DB). Use `notificationsRepo`
 * to assert what was created. notifyUser/notifyRole never throw, so this is a
 * faithful double for auto-notification call sites.
 */
export function makeNotifications(): {
  notifications: NotificationService;
  notificationsRepo: {
    create: ReturnType<typeof vi.fn>;
    createMany: ReturnType<typeof vi.fn>;
    findUserIdsByRole: ReturnType<typeof vi.fn>;
  };
} {
  const notificationsRepo = {
    create: vi.fn().mockResolvedValue({}),
    createMany: vi.fn().mockResolvedValue(0),
    findUserIdsByRole: vi.fn().mockResolvedValue([]),
  };
  const notifications = new NotificationService(
    notificationsRepo as unknown as NotificationsRepository,
  );
  return { notifications, notificationsRepo };
}

/**
 * In-memory StorageProvider double. Records uploads/deletes and lets tests
 * simulate backend failures by overriding any method.
 */
export function makeStorage(overrides: Partial<StorageProvider> = {}): {
  storage: StorageProvider;
  store: Map<string, Buffer>;
} {
  const store = new Map<string, Buffer>();
  let counter = 0;
  const storage: StorageProvider = {
    upload: async (object, keyPrefix): Promise<StoredFile> => {
      const storageKey = `${keyPrefix}/obj_${(counter += 1)}.pdf`;
      store.set(storageKey, object.buffer);
      return { storageKey, sizeBytes: object.buffer.byteLength };
    },
    delete: async (key) => {
      store.delete(key);
    },
    getPublicUrl: (key) => `/${key}`,
    exists: async (key) => store.has(key),
    read: async (key) => {
      const b = store.get(key);
      if (!b) throw new Error('not found');
      return b;
    },
    ...overrides,
  };
  return { storage, store };
}

/**
 * A real AuditService backed by a stub repository (no DB). Use `auditRepo` to
 * assert what was logged. AuditService never throws on log failure, so this is
 * a faithful test double for the centralized logger.
 */
export function makeAudit(): { audit: AuditService; auditRepo: { create: ReturnType<typeof vi.fn> } } {
  const auditRepo = { create: vi.fn().mockResolvedValue({}) };
  const audit = new AuditService(auditRepo as unknown as AuditRepository);
  return { audit, auditRepo };
}

/**
 * Builds a real AuthorizationService over a stubbed AssignmentReader. The
 * service itself is pure logic, so tests exercise the actual rules while
 * controlling which assignments "exist".
 */
export function makeAuthz(opts: {
  majors?: Set<string>;
  scholarships?: Set<string>;
} = {}): AuthorizationService {
  const majors = opts.majors ?? new Set<string>();
  const scholarships = opts.scholarships ?? new Set<string>();
  const reader: AssignmentReader = {
    isMajorAssigned: async (_userId, majorId) => majors.has(majorId),
    isScholarshipAssigned: async (_userId, scholarshipId) => scholarships.has(scholarshipId),
  };
  return new AuthorizationService(reader);
}
