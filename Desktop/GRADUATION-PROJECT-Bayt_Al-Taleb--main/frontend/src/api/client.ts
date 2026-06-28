/**
 * The shared Axios instance.
 *
 * Request interceptor: attaches `Authorization: Bearer <accessToken>`.
 * Response interceptor: on 401 it clears the session and redirects to /login;
 * for all errors it normalizes the backend `{ success:false, error }` envelope
 * into a consistent `ApiError` so callers always catch the same shape.
 *
 * NOTE: refresh-token auto-rotation is intentionally NOT implemented yet — a
 * 401 simply ends the session. Add a refresh flow here later.
 */

// ┌─────────────────────────────────────────────────────────────┐
// │ STUB — implement this file. (Reference impl in CodeDev.)     │
// └─────────────────────────────────────────────────────────────┘
// File: frontend/src/api/client.ts
// Expected exports: apiClient, setUnauthorizedHandler, unwrap
//
// TODO: implement.

export {};
