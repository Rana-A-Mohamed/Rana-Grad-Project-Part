import { FileOwnerType, RoleName } from '@prisma/client';
import { ForbiddenError } from '../../shared/errors/app-error.js';
import type { Actor, AssignmentReader } from './authorization.types.js';

/**
 * AuthorizationService — reusable ownership authorization for moderator-scoped
 * entities. This is the SINGLE source of truth for "can this user manage that
 * major/scholarship?", enforced in the service layer (not just middleware) so
 * the rule holds no matter which entry point reaches a mutation.
 *
 * Rules:
 *   - SUPER_ADMIN and ADMIN bypass ownership checks entirely.
 *   - MODERATOR may manage ONLY entities explicitly assigned to them.
 *   - Any other role is denied.
 *
 * `canManage*` return a boolean; `assertCanManage*` throw ForbiddenError on
 * denial (the form services use to fail fast). Does NOT redesign RBAC — it
 * complements the existing permission guards with row-level ownership.
 */
export class AuthorizationService {
  constructor(private readonly reader: AssignmentReader) {}

  // ── Boolean checks ────────────────────────────────────────────

  /** Returns true if the actor may manage the given major. */
  async canManageMajor(actor: Actor, majorId: string): Promise<boolean> {
    if (actor.role === RoleName.SUPER_ADMIN || actor.role === RoleName.ADMIN) {
      return true;
    }
    if (actor.role === RoleName.MODERATOR) {
      return this.reader.isMajorAssigned(actor.id, majorId);
    }
    return false;
  }

  /** Returns true if the actor may manage the given scholarship. */
  async canManageScholarship(actor: Actor, scholarshipId: string): Promise<boolean> {
    if (actor.role === RoleName.SUPER_ADMIN || actor.role === RoleName.ADMIN) {
      return true;
    }
    if (actor.role === RoleName.MODERATOR) {
      return this.reader.isScholarshipAssigned(actor.id, scholarshipId);
    }
    return false;
  }

  // ── Assertion guards (throw ForbiddenError on denial) ─────────

  /** Throws ForbiddenError if the actor may not manage the major. */
  async assertCanManageMajor(actor: Actor, majorId: string): Promise<void> {
    const allowed = await this.canManageMajor(actor, majorId);
    if (!allowed) {
      throw new ForbiddenError('You do not have permission to manage this major');
    }
  }

  /** Throws ForbiddenError if the actor may not manage the scholarship. */
  async assertCanManageScholarship(actor: Actor, scholarshipId: string): Promise<void> {
    const allowed = await this.canManageScholarship(actor, scholarshipId);
    if (!allowed) {
      throw new ForbiddenError('You do not have permission to manage this scholarship');
    }
  }

  /**
   * Gate for files and reviews endpoints.
   * SUPER_ADMIN / ADMIN bypass. MEMBER / VISITOR are not ownership-restricted
   * (they go through permission guards instead). Only MODERATOR is checked
   * against the file's owner entity.
   */
  async assertCanManageFileOwner(
    actor: Actor,
    ownerType: FileOwnerType,
    ownerId: string,
  ): Promise<void> {
    if (actor.role === RoleName.SUPER_ADMIN || actor.role === RoleName.ADMIN) {
      return;
    }
    if (actor.role === RoleName.MEMBER || actor.role === RoleName.VISITOR) {
      return;
    }
    // MODERATOR — check assignment to the owning entity
    if (ownerType === FileOwnerType.MAJOR) {
      await this.assertCanManageMajor(actor, ownerId);
    } else if (ownerType === FileOwnerType.SCHOLARSHIP) {
      await this.assertCanManageScholarship(actor, ownerId);
    }
  }
}
