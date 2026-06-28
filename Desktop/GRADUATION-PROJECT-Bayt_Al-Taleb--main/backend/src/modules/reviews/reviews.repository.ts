import type { FileReview } from '@prisma/client';
import type { Database } from '../../infrastructure/database/prisma.js';
import type { CreateReviewData, ReviewView } from './reviews.types.js';

export class ReviewsRepository {
  constructor(private readonly db: Database) {}

  /** Maps a raw Prisma FileReview row to the domain view. Never exposes raw Prisma models. */
  private toView(row: FileReview): ReviewView {
    return {
      id: row.id,
      fileId: row.fileId,
      reviewerId: row.reviewerId,
      action: row.action,
      comment: row.comment ?? null,
      createdAt: row.createdAt,
    };
  }

  /** Persist a new review record. Reviews are immutable — no update or delete. */
  async create(data: CreateReviewData): Promise<ReviewView> {
    const row = await this.db.fileReview.create({
      data: {
        fileId: data.fileId,
        reviewerId: data.reviewerId,
        action: data.action,
        comment: data.comment ?? null,
      },
    });
    return this.toView(row);
  }

  /** Return all reviews for a given file, newest first. */
  async listForFile(fileId: string): Promise<ReviewView[]> {
    const rows = await this.db.fileReview.findMany({
      where: { fileId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => this.toView(row));
  }
}