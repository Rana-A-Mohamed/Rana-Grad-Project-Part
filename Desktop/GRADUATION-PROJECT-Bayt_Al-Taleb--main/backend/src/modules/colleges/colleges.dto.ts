import type { CollegeView } from './colleges.types.js';

export interface CollegeDto {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function toDto(view: CollegeView): CollegeDto {
  return view;
}
