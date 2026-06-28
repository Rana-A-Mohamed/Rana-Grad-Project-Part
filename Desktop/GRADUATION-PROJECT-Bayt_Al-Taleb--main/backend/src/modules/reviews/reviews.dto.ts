import type { ReviewAction } from '@prisma/client';
import type { ReviewView } from './reviews.types.js';

export interface ReviewDto {
  id: string;
  fileId: string;
  reviewerId: string;
  action: ReviewAction;
  comment: string | null;
  createdAt: Date;
}

/** Maps a ReviewView to the outbound DTO. Same shape for now. */
export function toDto(view: ReviewView): ReviewDto {
  return view;
}
