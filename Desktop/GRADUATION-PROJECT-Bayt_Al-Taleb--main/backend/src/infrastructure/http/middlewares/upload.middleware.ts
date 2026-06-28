import type { NextFunction, Request, RequestHandler, Response } from 'express';
import multer, { MulterError } from 'multer';
import { BadRequestError } from '../../../shared/errors/app-error.js';
import { isAllowedType, safeExtension } from '../../storage/upload-constraints.js';

/**
 * Multer-based multipart upload middleware factory.
 *
 * Uses in-memory storage so the StorageProvider owns the actual write (the
 * backend decides where bytes land). Enforces, at request time:
 *   - size limit (configurable MB)
 *   - allowed extension (rejects double extensions & executables)
 *   - extension/MIME consistency (rejects spoofed content types)
 * Multer/our errors are normalized to BadRequestError so the central error
 * handler returns a clean 400.
 */
export function createUploadMiddleware(maxFileSizeMb: number): RequestHandler {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: maxFileSizeMb * 1024 * 1024,
      files: 1,
    },
    fileFilter: (_req, file, cb) => {
      const ext = safeExtension(file.originalname);
      if (!ext) {
        cb(new BadRequestError('Unsupported file type, double extension, or unsafe filename'));
        return;
      }
      if (!isAllowedType(ext, file.mimetype)) {
        cb(new BadRequestError(`File content (${file.mimetype}) does not match .${ext}`));
        return;
      }
      cb(null, true);
    },
  }).single('file');

  return (req: Request, res: Response, next: NextFunction) => {
    upload(req, res, (err: unknown) => {
      if (err) {
        next(normalizeUploadError(err));
        return;
      }
      if (!req.file) {
        next(new BadRequestError('No file uploaded (expected multipart field "file")'));
        return;
      }
      next();
    });
  };
}

function normalizeUploadError(err: unknown): Error {
  if (err instanceof BadRequestError) return err;
  if (err instanceof MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') return new BadRequestError('File exceeds the maximum allowed size');
    if (err.code === 'LIMIT_FILE_COUNT') return new BadRequestError('Only one file may be uploaded');
    return new BadRequestError(`Upload error: ${err.message}`);
  }
  return err instanceof Error ? err : new BadRequestError('Upload failed');
}
