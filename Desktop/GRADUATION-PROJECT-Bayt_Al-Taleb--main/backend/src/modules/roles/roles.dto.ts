import type { RoleName } from '@prisma/client';

export interface RoleDto {
  id: string;
  name: RoleName;
  description: string | null;
  createdAt: Date;
}