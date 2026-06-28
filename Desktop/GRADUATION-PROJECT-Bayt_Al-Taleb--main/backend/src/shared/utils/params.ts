import type { Request } from 'express';

/**
 * Read a route param that the `validate` middleware has already guaranteed.
 * Centralizes the "validated upstream" assertion so controllers stay clean
 * under `noUncheckedIndexedAccess` without scattering non-null assertions.
 */
export function param(req: Request, name: string): string {
  const value = req.params[name];
  if (value === undefined) {
    throw new Error(`Route param "${name}" is missing — is it declared in the path & schema?`);
  }
  return value;
}
