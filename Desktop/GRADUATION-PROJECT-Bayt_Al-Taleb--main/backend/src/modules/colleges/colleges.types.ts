import type { MajorView } from '../majors/majors.types.js';
export interface CollegeView {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  category: string;
  majors: MajorView[];
}
export interface CreateCollegeData {
  slug: string;
  name: string;
  description: string | null;
  isActive: boolean;
  category: string;
}

export interface UpdateCollegeData {
  slug?: string;
  name?: string;
  description?: string | null;
  isActive?: boolean;
  category?: string;
}
