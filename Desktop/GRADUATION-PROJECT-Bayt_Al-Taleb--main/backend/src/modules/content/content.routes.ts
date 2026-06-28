import { Router } from 'express';
import type { RequestHandler } from 'express'; // <-- ADD THIS
import { ContentController } from './content.controller.js';

// ADD authenticate to the arguments
export function createContentRouter(
  contentController: ContentController,
  authenticate?: RequestHandler,
): Router {
  const router = Router();

  // Public GET routes (no auth needed to read sections/faqs)
  router.get('/MAJOR/:entityId/sections', contentController.getSections);
  router.get('/MAJOR/:entityId/faqs', contentController.getFaqs);

  // Protected POST/PATCH/DELETE routes (Admin only)
  if (authenticate) {
    router.post('/MAJOR/:entityId/sections', authenticate, contentController.addSection);
    router.patch('/sections/:id', authenticate, contentController.updateSection);
    router.delete('/sections/:id', authenticate, contentController.deleteSection);
    router.post('/MAJOR/:entityId/faqs', authenticate, contentController.addFaq);
    router.patch('/faqs/:id', authenticate, contentController.updateFaq);
    router.delete('/faqs/:id', authenticate, contentController.deleteFaq);
  }

  return router;
}
