import type { MajorView } from './majors.types.js';

export interface MajorDto {
  id: string;
  slug: string;
  name: string;
  degree: string;
  isActive: boolean;
  collegeId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function toDto(view: MajorView): MajorDto {
  return view;
}
