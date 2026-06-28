import express, { type Application } from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { buildContainer } from './container.js';
import type { Container } from './container.js';
import { createApiRouter } from './routes.js';
import { errorHandler, notFoundHandler } from './infrastructure/http/middlewares/error.middleware.js';

/**
 * Creates the Express application.
 *
 * Pass a pre-built `container` to inject a stub DB for integration testing.
 * When omitted, `buildContainer()` is called with the real Prisma client.
 */
export function createApp(container?: Container): Application {
  const app = express();

  // ── Global middleware ────────────────────────────────────────
  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // ── Health check ────────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({ success: true, data: { status: 'ok' } });
  });

  // ── API routes ───────────────────────────────────────────────
  const resolved = container ?? buildContainer();
  app.use(env.API_PREFIX, createApiRouter(resolved));

  // ── Error handler (must be last) ────────────────────────────
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}