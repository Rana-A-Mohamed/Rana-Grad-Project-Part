export interface ScholarshipView {
  id: string;
  slug: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateScholarshipData {
  slug: string;
  name: string;
}

export interface UpdateScholarshipData {
  slug?: string;
  name?: string;
  isActive?: boolean;
}