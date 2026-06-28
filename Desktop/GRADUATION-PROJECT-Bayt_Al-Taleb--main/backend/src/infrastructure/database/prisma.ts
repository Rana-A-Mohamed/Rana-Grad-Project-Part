import { PrismaClient } from '@prisma/client';
import { isProduction } from '../../config/env.js';

/**
 * Single shared PrismaClient instance (connection pool).
 *
 * In dev with hot-reload we cache it on `globalThis` to avoid exhausting
 * connections across reloads. Repositories receive this client via the DI
 * container — they never import it directly, which keeps them mockable.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isProduction ? ['error'] : ['warn', 'error'],
  });

if (!isProduction) {
  globalForPrisma.prisma = prisma;
}

export type Database = PrismaClient;

export async function connectDatabase(): Promise<void> {
  await prisma.$connect();
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
