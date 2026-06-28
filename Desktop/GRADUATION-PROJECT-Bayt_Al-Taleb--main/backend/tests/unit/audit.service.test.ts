import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuditAction, AuditEntityType } from '@prisma/client';
import { AuditService } from '../../src/modules/audit/audit.service.js';
import type { AuditRepository } from '../../src/modules/audit/audit.repository.js';

/** AuditService unit tests — centralized logging + read. */
describe('AuditService', () => {
  let repo: AuditRepository;
  let service: AuditService;

  beforeEach(() => {
    repo = { create: vi.fn().mockResolvedValue({}), list: vi.fn() } as unknown as AuditRepository;
    service = new AuditService(repo);
  });

  it('persists an audit entry via the repository', async () => {
    await service.log({
      userId: 'u1',
      action: AuditAction.CREATE,
      entityType: AuditEntityType.MAJOR,
      entityId: 'maj_1',
    });
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'u1', action: AuditAction.CREATE }),
    );
  });

  it('never throws if the audit write fails (action already succeeded)', async () => {
    vi.mocked(repo.create).mockRejectedValue(new Error('db down'));
    await expect(
      service.log({
        userId: 'u1',
        action: AuditAction.DELETE,
        entityType: AuditEntityType.FILE,
        entityId: 'f1',
      }),
    ).resolves.toBeUndefined();
  });

  it('maps a paginated list to views', async () => {
    vi.mocked(repo.list).mockResolvedValue({
      items: [
        {
          id: 'a1',
          userId: 'u1',
          action: AuditAction.APPROVE,
          entityType: AuditEntityType.FILE,
          entityId: 'f1',
          reason: null,
          metadata: { newStatus: 'APPROVED' },
          createdAt: new Date(),
        },
      ],
      total: 1,
    });
    const { items, total } = await service.list({}, 1, 20);
    expect(total).toBe(1);
    expect(items[0]?.action).toBe(AuditAction.APPROVE);
  });
});
