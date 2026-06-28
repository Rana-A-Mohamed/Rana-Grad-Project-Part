import type { ReviewAction } from '@prisma/client';

/** Domain view of a file review record — returned by the repository. */
export interface ReviewView {
  id: string;
  fileId: string;
  reviewerId: string;
  /** The review decision. Prisma enum: ReviewAction.APPROVE | ReviewAction.REJECT */
  action: ReviewAction;
  comment: string | null;
  createdAt: Date;
}

/** Data required to create a new file review record. */
export interface CreateReviewData {
  fileId: string;
  reviewerId: string;
  /** Field is `action`, NOT `decision`. */
  action: ReviewAction;
  comment?: string | null;
}
