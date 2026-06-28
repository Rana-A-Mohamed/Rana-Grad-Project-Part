/**
 * Allowed upload types and the security rules around them. Single source of
 * truth shared by the Multer middleware (request-time rejection) and the
 * LocalStorageProvider (defense-in-depth at write time).
 */

/** extension → the MIME types we accept for it. */
export const ALLOWED_TYPES: Record<string, readonly string[]> = {
  pdf: ['application/pdf'],
  doc: ['application/msword'],
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  ppt: ['application/vnd.ms-powerpoint'],
  pptx: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  zip: ['application/zip', 'application/x-zip-compressed', 'multipart/x-zip'],
};

export const ALLOWED_EXTENSIONS = Object.keys(ALLOWED_TYPES);

/**
 * Extract a single, safe extension from a client filename. Rejects:
 *   - no extension
 *   - double extensions (e.g. "report.pdf.exe")  → returns null
 *   - disallowed extensions (e.g. ".exe", ".sh")  → returns null
 * Returns the lowercase extension (without dot) when valid, else null.
 */
export function safeExtension(originalName: string): string | null {
  // Strip any path the client may have injected (path traversal defense).
  const base = originalName.replace(/^.*[\\/]/, '').trim();
  const parts = base.split('.');
  // A clean filename has exactly: name + one extension → 2 parts.
  if (parts.length !== 2) return null; // 1 = no ext, 3+ = double extension
  const ext = parts[1]!.toLowerCase();
  return ALLOWED_EXTENSIONS.includes(ext) ? ext : null;
}

/** True if the (extension, mimeType) pair is an allowed, consistent combo. */
export function isAllowedType(ext: string, mimeType: string): boolean {
  const mimes = ALLOWED_TYPES[ext];
  return mimes ? mimes.includes(mimeType) : false;
}
