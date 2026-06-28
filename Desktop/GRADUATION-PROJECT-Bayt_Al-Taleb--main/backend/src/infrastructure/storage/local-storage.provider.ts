import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { BadRequestError } from '../../shared/errors/app-error.js';
import { safeExtension } from './upload-constraints.js';
import type { StorageObject, StoredFile, StorageProvider } from './storage.provider.js';

/**
 * Disk-backed StorageProvider. Files live under `<baseDir>` (default `uploads/`).
 *
 * Security:
 *   - The stored key is `<keyPrefix>/<uuid>.<ext>` — the client filename is
 *     NEVER used for the path, only to derive a validated extension.
 *   - Every resolved path is asserted to stay inside `baseDir` (path-traversal
 *     defense), so a malicious key/prefix can't escape the upload root.
 */
export class LocalStorageProvider implements StorageProvider {
  private readonly root: string;

  constructor(baseDir: string) {
    this.root = resolve(baseDir);
  }

  async upload(object: StorageObject, keyPrefix: string): Promise<StoredFile> {
    const ext = safeExtension(object.originalName);
    if (!ext) throw new BadRequestError('Unsupported or unsafe file name/extension');

    // Sanitize the prefix to a flat, safe segment set; reject traversal.
    const safePrefix = this.sanitizePrefix(keyPrefix);
    const storageKey = `${safePrefix}/${randomUUID()}.${ext}`;

    const absPath = this.toAbsolutePath(storageKey);
    await mkdir(dirname(absPath), { recursive: true });
    await writeFile(absPath, object.buffer);
    return { storageKey, sizeBytes: object.buffer.byteLength };
  }

  async delete(storageKey: string): Promise<void> {
    const absPath = this.toAbsolutePath(storageKey);
    await rm(absPath, { force: true });
  }

  getPublicUrl(storageKey: string): string {
    // Local backend has no CDN; downloads are served by the app's
    // GET /files/:id/download route. Expose the relative key for reference.
    return `/${storageKey}`;
  }

  async exists(storageKey: string): Promise<boolean> {
    try {
      await stat(this.toAbsolutePath(storageKey));
      return true;
    } catch {
      return false;
    }
  }

  async read(storageKey: string): Promise<Buffer> {
    return readFile(this.toAbsolutePath(storageKey));
  }

  // ── internals ───────────────────────────────────────────────────
  private sanitizePrefix(prefix: string): string {
    const segments = prefix
      .split('/')
      .map((s) => s.replace(/[^a-zA-Z0-9_-]/g, ''))
      .filter(Boolean);
    if (segments.length === 0) return 'misc';
    return segments.join('/');
  }

  /** Resolve a storage key to an absolute path, asserting it stays in root. */
  private toAbsolutePath(storageKey: string): string {
    const abs = resolve(join(this.root, storageKey));
    const rel = relative(this.root, abs);
    if (rel.startsWith('..') || rel.includes(`..${sep}`) || resolve(abs) !== abs) {
      throw new BadRequestError('Invalid storage key (path traversal detected)');
    }
    return abs;
  }
}
