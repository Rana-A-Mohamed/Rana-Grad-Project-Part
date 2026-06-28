import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

/**
 * Vite config.
 * - `@` → `src` path alias (used by Shadcn UI + feature imports).
 * - Dev proxy: forwards `/api` → the backend at localhost:4000, so the SPA
 *   calls a same-origin `/api/v1/...` and avoids CORS during development.
 *   Override the backend target with VITE_PROXY_TARGET if needed.
 */
export default defineConfig(({ mode }) => {
  const proxyTarget = process.env.VITE_PROXY_TARGET ?? 'http://localhost:4000';
  return {
    plugins: [react()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      port: 5173,
      proxy:
        mode === 'development'
          ? { '/api': { target: proxyTarget, changeOrigin: true } }
          : undefined,
    },
  };
});
