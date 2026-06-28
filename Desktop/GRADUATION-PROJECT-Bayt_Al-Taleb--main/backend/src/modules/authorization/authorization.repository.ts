import type { Database } from '../../infrastructure/database/prisma.js';
import type { AssignmentReader } from './authorization.types.js';

/**
 * Data-access for moderator assignments. Reads the existing many-to-many
 * relations (MajorModerators / ScholarshipModerators) — no schema changes.
 */
export class AuthorizationRepository implements AssignmentReader {
  constructor(private readonly db: Database) {}

  /** Returns true if the user is assigned as a moderator of the given major. */
  async isMajorAssigned(userId: string, majorId: string): Promise<boolean> {
    const count = await this.db.major.count({
      where: {
        id: majorId,
        moderators: { some: { id: userId } },
      },
    });
    return count > 0;
  }

  /** Returns true if the user is assigned as a moderator of the given scholarship. */
  async isScholarshipAssigned(userId: string, scholarshipId: string): Promise<boolean> {
    const count = await this.db.scholarship.count({
      where: {
        id: scholarshipId,
        moderators: { some: { id: userId } },
      },
    });
    return count > 0;
  }
}
