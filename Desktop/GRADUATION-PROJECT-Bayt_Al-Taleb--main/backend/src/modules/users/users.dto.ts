import type { RoleName } from '@prisma/client';

export interface UserDto {
  id: string;
  email: string;
  fullName: string;
  role: RoleName;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}