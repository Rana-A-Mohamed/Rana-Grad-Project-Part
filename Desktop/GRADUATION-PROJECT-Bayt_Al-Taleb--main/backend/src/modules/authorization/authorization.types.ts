import type { RoleName } from '@prisma/client';

/**
 * The minimal caller identity an authorization decision needs: who they are
 * (id) and what role they hold. A subset of `AuthenticatedUser`, so any
 * authenticated request satisfies it. Threaded into service methods that
 * perform ownership-restricted mutations.
 */
export interface Actor {
  id: string;
  role: RoleName;
}

/**
 * Read-only interface for checking moderator ↔ entity assignments.
 * `AuthorizationRepository` implements this; tests stub it.
 */
export interface AssignmentReader {
  isMajorAssigned(userId: string, majorId: string): Promise<boolean>;
  isScholarshipAssigned(userId: string, scholarshipId: string): Promise<boolean>;
}
