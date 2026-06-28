import type { ContactMessage, Prisma } from '@prisma/client';
import type { Database } from '../../infrastructure/database/prisma.js';
import type { ContactMessageView, SubmitContactData } from './contact.types.js';

export class ContactRepository {
  constructor(private readonly db: Database) {}

  /**
   * Maps a raw Prisma ContactMessage row to the domain view.
   *
   * NOTE: The Prisma schema names the text column `message`, but the domain
   * view exposes it as `body` for consistency with the API spec. This mapper
   * is the single bridge between those two names.
   */
  private toView(row: ContactMessage): ContactMessageView {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      subject: row.subject,
      body: row.message,
      isHandled: (row as ContactMessage & { isHandled?: boolean }).isHandled ?? false,
      createdAt: row.createdAt,
    };
  }

  async create(data: SubmitContactData): Promise<ContactMessageView> {
    const row = await this.db.contactMessage.create({
      data: {
        name: data.name,
        email: data.email,
        subject: data.subject,
        // `body` in the domain maps to the `message` column in the DB.
        message: data.body,
      },
    });
    return this.toView(row);
  }

  async findById(id: string): Promise<ContactMessageView | null> {
    const row = await this.db.contactMessage.findUnique({ where: { id } });
    return row ? this.toView(row) : null;
  }

  async list(params: {
    skip: number;
    take: number;
    search?: string;
  }): Promise<{ items: ContactMessageView[]; total: number }> {
    const where: Prisma.ContactMessageWhereInput = {};

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
        { subject: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [rows, total] = await Promise.all([
      this.db.contactMessage.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: 'desc' },
      }),
      this.db.contactMessage.count({ where }),
    ]);

    return {
      items: rows.map((row) => this.toView(row)),
      total,
    };
  }

  /**
   * Marks a contact message as handled.
   * Returns the updated view, or null if the id was not found.
   */
  async markHandled(id: string): Promise<ContactMessageView | null> {
    try {
      const row = await this.db.contactMessage.update({
        where: { id },
        data: { isHandled: true } as Prisma.ContactMessageUpdateInput,
      });
      return this.toView(row);
    } catch {
      return null;
    }
  }

  /**
   * Hard-deletes a contact message by id.
   * Returns `true` if a row was deleted, `false` if the id was not found.
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.db.contactMessage.deleteMany({ where: { id } });
    return result.count > 0;
  }
}