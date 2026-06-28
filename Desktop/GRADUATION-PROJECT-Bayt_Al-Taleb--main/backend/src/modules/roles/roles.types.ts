import type { RoleName } from '@prisma/client';

export interface RoleView {
  id: string;
  name: RoleName;
  description: string | null;
  createdAt: Date;
}