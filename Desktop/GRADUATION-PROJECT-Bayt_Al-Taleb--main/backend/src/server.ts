/**
 * Process entry point. Connects the DB, starts the HTTP server, and wires
 * graceful shutdown. `app.ts` stays networking-free so it remains testable.
 */

// ┌─────────────────────────────────────────────────────────────┐
// │ STUB — implement this file. (Reference impl in CodeDev.)     │
// └─────────────────────────────────────────────────────────────┘
// File: backend/src/server.ts
//
// TODO: implement.

import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './infrastructure/database/prisma.js';
import { logger } from './infrastructure/logger/logger.js';
import { env } from './config/env.js';




async function main() {
  await connectDatabase();
  logger.info('Database connected');

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    logger.info(`Server running on http://localhost:${env.PORT}${env.API_PREFIX}`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received — shutting down`);
    server.close(async () => {
      await disconnectDatabase();
      logger.info('Server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  logger.error(err, 'Fatal error');
  process.exit(1);
});