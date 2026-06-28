import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { LocalStorageProvider } from '../../src/infrastructure/storage/local-storage.provider.js';
import { isAllowedType, safeExtension } from '../../src/infrastructure/storage/upload-constraints.js';
import { BadRequestError } from '../../src/shared/errors/app-error.js';

describe('upload-constraints', () => {
  it('accepts a clean allowed extension', () => {
    expect(safeExtension('notes.pdf')).toBe('pdf');
    expect(safeExtension('Slides.PPTX')).toBe('pptx');
  });

  it('rejects double extensions and executables', () => {
    expect(safeExtension('evil.pdf.exe')).toBeNull();
    expect(safeExtension('run.sh')).toBeNull();
    expect(safeExtension('noext')).toBeNull();
  });

  it('strips client path segments (traversal in filename)', () => {
    // "../../etc/passwd.pdf" → base "passwd.pdf" → allowed
    expect(safeExtension('../../etc/passwd.pdf')).toBe('pdf');
    // but a traversal name without a clean single ext is rejected
    expect(safeExtension('../../etc/passwd')).toBeNull();
  });

  it('enforces extension/MIME consistency', () => {
    expect(isAllowedType('pdf', 'application/pdf')).toBe(true);
    expect(isAllowedType('pdf', 'application/x-msdownload')).toBe(false);
  });
});

describe('LocalStorageProvider', () => {
  let dir: string;
  let provider: LocalStorageProvider;

  beforeAll(async () => {
    dir = await mkdtemp(join(tmpdir(), 'bat-storage-'));
    provider = new LocalStorageProvider(dir);
  });

  afterAll(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('uploads, reads back, reports existence, and deletes', async () => {
    const { storageKey, sizeBytes } = await provider.upload(
      { buffer: Buffer.from('hello'), originalName: 'doc.pdf', mimeType: 'application/pdf' },
      'MAJOR/maj_1',
    );
    expect(storageKey).toMatch(/^MAJOR\/maj_1\/.*\.pdf$/);
    expect(sizeBytes).toBe(5);
    expect(await provider.exists(storageKey)).toBe(true);
    expect((await provider.read(storageKey)).toString()).toBe('hello');

    await provider.delete(storageKey);
    expect(await provider.exists(storageKey)).toBe(false);
  });

  it('never uses the client filename for the stored path', async () => {
    const { storageKey } = await provider.upload(
      { buffer: Buffer.from('x'), originalName: 'secret-name.pdf', mimeType: 'application/pdf' },
      'MAJOR/maj_1',
    );
    expect(storageKey).not.toContain('secret-name');
  });

  it('rejects an unsafe/unsupported extension', async () => {
    await expect(
      provider.upload(
        { buffer: Buffer.from('x'), originalName: 'malware.exe', mimeType: 'application/pdf' },
        'MAJOR/maj_1',
      ),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('sanitizes a traversal-laden key prefix to stay inside the root', async () => {
    const { storageKey } = await provider.upload(
      { buffer: Buffer.from('x'), originalName: 'a.pdf', mimeType: 'application/pdf' },
      '../../etc',
    );
    // ".." segments are stripped, so the key cannot escape the upload root.
    expect(storageKey.startsWith('..')).toBe(false);
    expect(await provider.exists(storageKey)).toBe(true);
    await provider.delete(storageKey);
  });

  it('delete is a no-op for a missing key', async () => {
    await expect(provider.delete('MAJOR/maj_1/does-not-exist.pdf')).resolves.toBeUndefined();
  });

  it('getPublicUrl returns the key path', () => {
    expect(provider.getPublicUrl('MAJOR/maj_1/x.pdf')).toBe('/MAJOR/maj_1/x.pdf');
  });
});
