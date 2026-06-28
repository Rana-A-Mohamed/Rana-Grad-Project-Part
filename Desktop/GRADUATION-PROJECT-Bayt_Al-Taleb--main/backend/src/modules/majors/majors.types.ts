export interface MajorView {
  id: string;
  slug: string;
  name: string;
  degree: string;
  isActive: boolean;
  collegeId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMajorData {
  slug: string;
  name: string;
  degree?: string;
  isActive?: boolean;
  collegeId?: string | null;
}

export interface UpdateMajorData {
  slug?: string;
  name?: string;
  degree?: string;
  isActive?: boolean;
  collegeId?: string | null;
}
