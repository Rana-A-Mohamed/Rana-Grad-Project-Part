import { logger } from '../../infrastructure/logger/logger.js';
import type { Paginated } from '../../shared/types/index.js';
import type { AuditRepository } from './audit.repository.js';
import type { AuditEntry, AuditLogFilter, AuditLogView } from './audit.types.js';

/**
 * AuditService — THE single, centralized entry point for recording important
 * actions (CREATE/UPDATE/DELETE/RESTORE/APPROVE/REJECT). Every module that
 * mutates auditable state calls `service.log(...)` instead of writing audit
 * rows itself, so the audit trail has one consistent shape and one writer.
 *
 * Logging never blocks or fails the business operation: a failure to persist
 * an audit row is logged and swallowed (the action already succeeded). Callers
 * `await` it but a rejected write won't surface as a request error.
 */
export class AuditService {
  constructor(private readonly repo: AuditRepository) {}

  /**
   * Fire-and-forget audit entry. NEVER throws.
   * On error: logs the failure via pino and returns void.
   */
  async log(entry: AuditEntry): Promise<void> {
    try {
      await this.repo.create(entry);
    } catch (err) {
      logger.error({ err, entry }, 'Failed to persist audit log');
    }
  }

  /** Paginated, filterable audit log list. CAN throw on error. */
  async list(
    filter: AuditLogFilter,
    page: number,
    pageSize: number,
  ): Promise<Paginated<AuditLogView>> {
    const { items, total } = await this.repo.list(filter, page, pageSize);
    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}
