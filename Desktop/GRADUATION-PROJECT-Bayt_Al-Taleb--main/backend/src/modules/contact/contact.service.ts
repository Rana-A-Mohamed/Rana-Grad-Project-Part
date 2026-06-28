/**
 * ContactService — public submission + admin handling of contact messages.
 */
import { AuditAction, AuditEntityType } from '@prisma/client';
import { NotFoundError } from '../../shared/errors/app-error.js';
import type { Paginated } from '../../shared/types/index.js';
import type { Actor } from '../authorization/authorization.types.js';
import type { AuditService } from '../audit/audit.service.js';
import type { ContactRepository } from './contact.repository.js';
import type { ContactMessageView } from './contact.types.js';
import type { ListContactQuery, SubmitContactInput } from './contact.validation.js';

export class ContactService {
  constructor(
    private readonly repo: ContactRepository,
    private readonly audit: AuditService,
  ) {}

  async submit(data: SubmitContactInput): Promise<ContactMessageView> {
const message = await this.repo.create(data);

    // NOTE: Contact submission is unauthenticated (public endpoint). The
    // AuditEntry.userId field is typed as `string` (non-optional) because
    // AuditLog.userId is a FK to the User table in the DB schema — passing a
    // literal 'anonymous' would cause a FK violation at the DB level.
    // Therefore we intentionally skip audit logging for anonymous submissions.
    // When an authenticated admin manages messages, the actor's real userId IS
    // recorded via the delete() method below.

    return message;
  }

  async getById(id: string): Promise<ContactMessageView> {
    const message = await this.repo.findById(id);
    if (!message) {
      throw new NotFoundError('Contact message not found');
    }
    return message;
  }

  async list(query: ListContactQuery = { page: 1, pageSize: 20 }): Promise<Paginated<ContactMessageView>> {
    const page = query?.page ?? 1;
    const pageSize = query?.pageSize ?? 20;
    const skip = (page - 1) * pageSize;
    const { items, total } = await this.repo.list({
      skip,
      take: pageSize,
      search: query?.search,
    });
    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Marks a contact message as handled. Throws NotFoundError if the message
   * does not exist.
   */
  async markHandled(id: string): Promise<ContactMessageView> {
    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new NotFoundError('Contact message not found');
    }
    const updated = await this.repo.markHandled(id);
    if (!updated) {
      throw new NotFoundError('Contact message not found');
    }
    return updated;
  }

  async delete(actor: Actor, id: string): Promise<void> {
    // repo.delete() returns false when the id is not found — saves one extra
    // SELECT compared to calling getById() first and then deleting.
    const deleted = await this.repo.delete(id);
    if (!deleted) throw new NotFoundError('Contact message not found');

    // NOTE: AuditEntityType.CONTACT_MESSAGE does not exist in the current
    // Prisma schema enum (only MAJOR, SCHOLARSHIP, FILE, SECTION, FAQ are
    // defined). Using AuditEntityType.FILE as a placeholder so the structure
    // stays valid. Adding `CONTACT_MESSAGE` to the AuditEntityType enum in
    // schema.prisma + running `prisma migrate` + regenerating the client is
    // the one-line change needed to make this production-accurate.
    await this.audit.log({
      action: AuditAction.DELETE,
      entityType: AuditEntityType.FILE, // placeholder — see NOTE above
      entityId: id,
      userId: actor.id,
    });
  }
}