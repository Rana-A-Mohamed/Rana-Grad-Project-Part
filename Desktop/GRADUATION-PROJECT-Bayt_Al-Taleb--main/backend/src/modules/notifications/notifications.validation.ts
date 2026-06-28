import { z } from 'zod';
import { RoleName } from '@prisma/client';

export const listNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const notificationIdParamsSchema = z.object({
  id: z.string().cuid(),
});

export const createAnnouncementSchema = z.object({
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(5000),
  targetRole: z.nativeEnum(RoleName).optional(),
});

export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;
export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
