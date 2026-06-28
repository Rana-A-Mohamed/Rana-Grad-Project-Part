import type { FileOwnerType, FileStatus, FileType } from '@prisma/client';

/**
 * The domain view of a file — what services and controllers work with.
 * Never exposes raw Prisma models outside the repository layer.
 */
export interface FileView {
  id: string;
  title: string;
  description: string | null;
  type: FileType;
  status: FileStatus;
  storageKey: string;
  mimeType: string | null;
  sizeBytes: number | null;
  ownerType: FileOwnerType;
  ownerId: string;
  uploadedById: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

/** Data needed to persist a new file record (without or after binary storage). */
export interface UploadFileData {
  title: string;
  description?: string | null;
  type: FileType;
  status?: FileStatus;
  ownerType: FileOwnerType;
  ownerId: string;
  uploadedById?: string;
  storageKey: string;
  mimeType?: string | null;
  sizeBytes?: number | null;
}

/** Query filters for listing files. */
export interface FileListFilter {
  ownerType?: FileOwnerType;
  ownerId?: string;
  status?: FileStatus;
  type?: FileType;
  uploadedById?: string;
  page: number;
  pageSize: number;
}

/** Metadata submitted alongside the binary (parsed from multipart form fields). */
export interface UploadFileMeta {
  title: string;
  description?: string | null;
  type: FileType;
  ownerType: FileOwnerType;
  ownerId: string;
}

/** The binary payload from `req.file` after Multer processes the upload. */
export interface UploadedBinary {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  sizeBytes?: number;
}

/** Returned by FilesService.getDownload / prepareDownload — the bytes + metadata to stream. */
export interface FileDownload {
  buffer: Buffer;
  mimeType: string;
  /** Filename for the Content-Disposition header. */
  fileName: string;
  /** Alias for backward compat with controllers that use `filename`. */
  filename?: string;
}

/**
 * Implemented by modules that own file entities (MajorsService, ScholarshipsService).
 * FilesService receives a map of these at construction time to validate
 * `ownerType/ownerId` pairs without coupling to those services' internals.
 *
 * The `exists` method is called with `(ownerType, ownerId)` so the checker can
 * perform type-specific queries (e.g., look up a major vs. scholarship).
 */
export interface FileOwnerExistenceChecker {
  exists(ownerType: FileOwnerType, ownerId: string): Promise<boolean>;
}
