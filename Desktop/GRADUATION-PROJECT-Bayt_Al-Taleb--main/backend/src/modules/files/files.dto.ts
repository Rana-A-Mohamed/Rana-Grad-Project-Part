import type { FileView } from './files.types.js';

/**
 * JSON-safe representation of a file sent to clients.
 * - All `Date` fields are serialized as ISO strings.
 * - `storageKey` is intentionally omitted (never exposed to clients).
 * - `publicUrl` is resolved by the caller before building the DTO.
 */
export interface FileDto {
  id: string;
  title: string;
  description: string | null;
  type: string;        // FileType value
  status: string;      // FileStatus value
  publicUrl: string;   // resolved by caller, never the raw storageKey
  mimeType: string | null;
  sizeBytes: number | null;
  ownerType: string;
  ownerId: string;
  uploadedById: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

/**
 * Map a `FileView` to the JSON-safe `FileDto`.
 *
 * @param view       The domain file view from the service layer.
 * @param publicUrl  The public URL resolved by the caller via StorageProvider.
 */
export function toFileDto(view: FileView, publicUrl: string): FileDto {
  return {
    id: view.id,
    title: view.title,
    description: view.description,
    type: view.type,
    status: view.status,
    publicUrl,
    mimeType: view.mimeType,
    sizeBytes: view.sizeBytes,
    ownerType: view.ownerType,
    ownerId: view.ownerId,
    uploadedById: view.uploadedById,
    createdAt: view.createdAt.toISOString(),
    updatedAt: view.updatedAt.toISOString(),
    deletedAt: view.deletedAt ? view.deletedAt.toISOString() : null,
  };
}
