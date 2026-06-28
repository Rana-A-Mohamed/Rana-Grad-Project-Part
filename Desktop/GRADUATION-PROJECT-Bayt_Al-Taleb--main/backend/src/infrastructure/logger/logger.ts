import { pino } from 'pino';
import { env, isProduction } from '../../config/env.js';

/**
 * Application logger. Pretty-printed in dev, structured JSON in production
 * (ready for log aggregators / CI/CD pipelines).
 */
export const logger = pino({
  level: env.LOG_LEVEL,
  transport: isProduction
    ? undefined
    : {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'SYS:standard', ignore: 'pid,hostname' },
      },
});

export type Logger = typeof logger;
