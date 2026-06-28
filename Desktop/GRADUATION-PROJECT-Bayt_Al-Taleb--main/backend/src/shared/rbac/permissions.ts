import { RoleName } from '@prisma/client';

/**
 * Central permission catalogue.
 *
 * Permissions are stable string keys of the form `resource:action`.
 * Authorization checks compare a user's granted permissions (resolved from
 * their role) against the permission a route requires — see `role.guard`.
 *
 * To add a capability:
 *   1. add a key here,
 *   2. grant it to the relevant role(s) in ROLE_PERMISSIONS,
 *   3. re-run `prisma db seed`.
 * No code in controllers/services changes.
 */
export const PERMISSIONS = {
  // Users
  USERS_READ: 'users:read',
  USERS_MANAGE: 'users:manage',
  // Roles
  ROLES_READ: 'roles:read',
  ROLES_ASSIGN: 'roles:assign',
  // Moderators (admin-level capability)
  MODERATORS_MANAGE: 'moderators:manage',
  // Content (majors / scholarships + their sections/faqs)
  MAJORS_READ: 'majors:read',
  MAJORS_MANAGE: 'majors:manage',
  SCHOLARSHIPS_READ: 'scholarships:read',
  SCHOLARSHIPS_MANAGE: 'scholarships:manage',
  CONTENT_MANAGE: 'content:manage',
  // Files
  FILES_READ: 'files:read',
  FILES_UPLOAD: 'files:upload',
  FILES_MANAGE: 'files:manage',
  FILES_REVIEW: 'files:review',
  // Contact
  CONTACT_SUBMIT: 'contact:submit',
  CONTACT_MANAGE: 'contact:manage',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS);

/**
 * Role → granted permissions.
 * SUPER_ADMIN is special-cased as "all permissions" in the guard, but we still
 * grant the full set explicitly so the database reflects reality.
 */
export const ROLE_PERMISSIONS: Record<RoleName, Permission[]> = {
  [RoleName.SUPER_ADMIN]: ALL_PERMISSIONS,

  [RoleName.ADMIN]: [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.MODERATORS_MANAGE,
    PERMISSIONS.MAJORS_READ,
    PERMISSIONS.MAJORS_MANAGE,
    PERMISSIONS.SCHOLARSHIPS_READ,
    PERMISSIONS.SCHOLARSHIPS_MANAGE,
    PERMISSIONS.CONTENT_MANAGE,
    PERMISSIONS.FILES_READ,
    PERMISSIONS.FILES_MANAGE,
    PERMISSIONS.CONTACT_MANAGE,
  ],

  [RoleName.MODERATOR]: [
    PERMISSIONS.MAJORS_READ,
    PERMISSIONS.MAJORS_MANAGE,
    PERMISSIONS.SCHOLARSHIPS_READ,
    PERMISSIONS.SCHOLARSHIPS_MANAGE,
    PERMISSIONS.CONTENT_MANAGE,
    PERMISSIONS.FILES_READ,
    PERMISSIONS.FILES_REVIEW,
  ],

  [RoleName.MEMBER]: [
    PERMISSIONS.MAJORS_READ,
    PERMISSIONS.SCHOLARSHIPS_READ,
    PERMISSIONS.FILES_READ,
    PERMISSIONS.FILES_UPLOAD,
    PERMISSIONS.CONTACT_SUBMIT,
  ],

  [RoleName.VISITOR]: [
    PERMISSIONS.MAJORS_READ,
    PERMISSIONS.SCHOLARSHIPS_READ,
    PERMISSIONS.FILES_READ,
    PERMISSIONS.CONTACT_SUBMIT,
  ],
};

/** Resolve the permission set for a role. SUPER_ADMIN always gets everything. */
export function permissionsForRole(role: RoleName): Set<Permission> {
  if (role === RoleName.SUPER_ADMIN) return new Set(ALL_PERMISSIONS);
  return new Set(ROLE_PERMISSIONS[role] ?? []);
}
