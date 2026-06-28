import type { RoleName } from '@prisma/client';

export interface UserView {
  id: string;
  email: string;
  fullName: string;
  role: RoleName;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserData {
  email: string;
  password: string;
  fullName: string;
  roleId: string;
}

export interface UpdateUserData {
  fullName?: string;
  isActive?: boolean;
  roleId?: string;
}