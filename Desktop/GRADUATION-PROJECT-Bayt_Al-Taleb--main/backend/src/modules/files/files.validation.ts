import { z } from 'zod';
import { FileOwnerType, FileStatus, FileType } from '@prisma/client';

/**
 * Validates the body fields for a file upload (JSON or multipart text fields).
 * The binary itself is handled by Multer — only metadata is validated here.
 */
export const uploadFileSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).nullish().transform((v) => v ?? null),
  type: z.nativeEnum(FileType),
  ownerType: z.nativeEnum(FileOwnerType),
  ownerId: z.string().min(1),
});

/**
 * Identical to uploadFileSchema — used as the multipart metadata schema
 * (form fields parsed alongside the binary).
 */
export const uploadFileMetaSchema = uploadFileSchema;

/** Params schema for routes that address a single file by ID. */
export const fileIdParamsSchema = z.object({
  fileId: z.string().min(1),
});

/** Params schema for routes that address files by their polymorphic owner. */
export const fileOwnerParamsSchema = z.object({
  ownerType: z.nativeEnum(FileOwnerType),
  ownerId: z.string().min(1),
});

/** Query-string schema for the paginated file list endpoint. */
export const listFilesQuerySchema = z.object({
  ownerType: z.nativeEnum(FileOwnerType).optional(),
  ownerId: z.string().optional(),
  status: z.nativeEnum(FileStatus).optional(),
  type: z.nativeEnum(FileType).optional(),
  uploadedById: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

// ── Inferred types ──────────────────────────────────────────────────────────

export type UploadFileInput = z.infer<typeof uploadFileSchema>;
export type UploadFileMetaInput = z.infer<typeof uploadFileMetaSchema>;
export type FileOwnerParams = z.infer<typeof fileOwnerParamsSchema>;
export type ListFilesQuery = z.infer<typeof listFilesQuerySchema>;
