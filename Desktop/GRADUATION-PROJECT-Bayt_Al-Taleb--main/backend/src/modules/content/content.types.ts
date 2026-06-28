export enum EntityType {
  MAJOR = 'MAJOR',
  SCHOLARSHIP = 'SCHOLARSHIP',
}

export interface SectionView {
  id: string;
  entityType: EntityType;
  entityId: string;
  title: string;
  content: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FaqView {
  id: string;
  entityType: EntityType;
  entityId: string;
  question: string;
  answer: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSectionData {
  title: string;
  content: string;
  sortOrder?: number;
}

export interface UpdateSectionData {
  title?: string;
  content?: string;
  sortOrder?: number;
}

export interface CreateFaqData {
  question: string;
  answer: string;
  sortOrder?: number;
}

export interface UpdateFaqData {
  question?: string;
  answer?: string;
  sortOrder?: number;
}
