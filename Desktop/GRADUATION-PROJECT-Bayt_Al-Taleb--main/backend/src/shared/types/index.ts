import type { RoleName } from '@prisma/client';
import type { Permission } from '../rbac/permissions.js';

/** The identity attached to a request after authentication. */
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: RoleName;
  permissions: Set<Permission>;
}

/** Standard paginated query parameters. */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

/** Standard paginated response envelope. */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Uniform success envelope returned by controllers. */
export interface ApiResponse<T> {
  success: true;
  data: T;
}

/** Uniform error envelope produced by the error middleware. */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
