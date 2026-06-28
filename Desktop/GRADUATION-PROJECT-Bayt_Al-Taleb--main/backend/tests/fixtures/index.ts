import {
  FileOwnerType,
  FileStatus,
  FileType,
  ReviewAction,
  RoleName,
  type College,
  type Faq,
  type File,
  type FileReview,
  type Major,
  type Scholarship,
  type Section,
  type User,
} from '@prisma/client';

/**
 * Reusable, fully-typed entity fixtures. Each factory returns a complete row
 * with sensible defaults; pass overrides to vary a field per test.
 */
const T0 = new Date('2026-01-01T00:00:00.000Z');

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'usr_1',
    email: 'student@example.com',
    passwordHash: 'hashed:password123',
    fullName: 'Test Student',
    isActive: true,
    roleId: 'role_member',
    createdAt: T0,
    updatedAt: T0,
    ...overrides,
  };
}

/** Soft-delete columns, defaulting to "not deleted". */
const NOT_DELETED = { deletedAt: null, deletedById: null, deleteReason: null };

export function makeCollege(overrides: Partial<College> = {}): College {
  return {
    id: 'col_1',
    slug: 'engineering',
    name: 'Engineering',
    description: null,
    isActive: true,
    createdAt: T0,
    updatedAt: T0,
    ...overrides,
  };
}

export function makeMajor(overrides: Partial<Major> = {}): Major {
  return {
    id: 'maj_1',
    slug: 'computer-science',
    name: 'Computer Science',
    isActive: true,
    collegeId: null,
    createdAt: T0,
    updatedAt: T0,
    ...NOT_DELETED,
    ...overrides,
  };
}

export function makeScholarship(overrides: Partial<Scholarship> = {}): Scholarship {
  return {
    id: 'sch_1',
    slug: 'fulbright',
    name: 'Fulbright',
    isActive: true,
    createdAt: T0,
    updatedAt: T0,
    ...NOT_DELETED,
    ...overrides,
  };
}

export function makeSection(overrides: Partial<Section> = {}): Section {
  return {
    id: 'sec_1',
    entityType: 'MAJOR',
    entityId: 'maj_1',
    title: 'Overview',
    content: 'Some content',
    sortOrder: 0,
    createdAt: T0,
    updatedAt: T0,
    ...NOT_DELETED,
    ...overrides,
  };
}

export function makeFaq(overrides: Partial<Faq> = {}): Faq {
  return {
    id: 'faq_1',
    entityType: 'MAJOR',
    entityId: 'maj_1',
    question: 'Q?',
    answer: 'A',
    sortOrder: 0,
    createdAt: T0,
    updatedAt: T0,
    ...NOT_DELETED,
    ...overrides,
  };
}

export function makeFile(overrides: Partial<File> = {}): File {
  return {
    id: 'file_1',
    title: 'Calculus Summary',
    description: null,
    type: FileType.SUMMARY,
    status: FileStatus.PENDING,
    storageKey: 'uploads/file_1.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 1024,
    ownerType: FileOwnerType.MAJOR,
    ownerId: 'maj_1',
    uploadedById: 'usr_1',
    createdAt: T0,
    updatedAt: T0,
    ...NOT_DELETED,
    ...overrides,
  };
}

export function makeReview(overrides: Partial<FileReview> = {}): FileReview {
  return {
    id: 'rev_1',
    fileId: 'file_1',
    reviewerId: 'usr_mod',
    action: ReviewAction.APPROVE,
    comment: null,
    createdAt: T0,
    ...overrides,
  };
}

export const ROLES = RoleName;
