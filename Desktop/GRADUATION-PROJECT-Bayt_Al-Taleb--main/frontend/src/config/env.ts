/**
 * Typed access to Vite env vars. Single place that reads `import.meta.env`,
 * so the rest of the app imports a clean config object.
 */
export const env = {
  /** API base URL. In dev this is `/api/v1` (proxied by Vite to the backend). */
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
} as const;
