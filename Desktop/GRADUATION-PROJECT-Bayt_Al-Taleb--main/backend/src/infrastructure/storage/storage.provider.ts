/**
 * Storage abstraction. FilesService depends ONLY on this interface, so a new
 * backend (S3, Cloudflare R2, Azure Blob) is a drop-in: implement
 * StorageProvider and swap it in the DI container — no service/controller change.
 */

/** A binary object to persist. */
export interface StorageObject {
  /** Raw bytes. */
  buffer: Buffer;
  /** Original client filename (used to derive a safe extension only). */
  originalName: string;
  /** Detected/declared MIME type. */
  mimeType: string;
}

/** Result of a successful upload. */
export interface StoredFile {
  /** Backend-agnostic key used to fetch/delete later (e.g. a path or object id). */
  storageKey: string;
  sizeBytes: number;
}

export interface StorageProvider {
  /**
   * Persist an object under a logical `keyPrefix` (e.g. "MAJOR/<id>"). The
   * provider generates a unique, collision-free key and returns it. Never
   * trusts the client filename for the stored path.
   */
  upload(object: StorageObject, keyPrefix: string): Promise<StoredFile>;

  /** Remove a stored object. No-op if it does not exist. */
  delete(storageKey: string): Promise<void>;

  /** A URL/path clients can use to fetch the object (impl-specific). */
  getPublicUrl(storageKey: string): string;

  /** Whether the object currently exists in the backend. */
  exists(storageKey: string): Promise<boolean>;

  /**
   * Read an object's bytes back (used by the download endpoint when the
   * provider serves through the app rather than via a signed URL).
   */
  read(storageKey: string): Promise<Buffer>;
}
