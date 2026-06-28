import { Router } from 'express';
import type { Container } from './container.js';
import { createAuthRouter } from './modules/auth/auth.routes.js';
import { createUsersRouter } from './modules/users/users.routes.js';
import { createRolesRouter } from './modules/roles/roles.routes.js';
import { createScholarshipsRouter } from './modules/scholarships/scholarships.routes.js';
import { createDeletedItemsRouter } from './modules/deleted-items/deleted-items.routes.js';
import { createCollegesRouter } from './modules/colleges/colleges.routes.js';
import { createMajorsRouter } from './modules/majors/majors.routes.js';
import { createContentRouter } from './modules/content/content.routes.js';

/**
 * Builds the versioned API router (/api/v1).
 * Mount a new module by adding one line here.
 */
export function createApiRouter(container: Container): Router {
  const router = Router();

  router.use('/auth', createAuthRouter(container.authController));
  router.use('/users', createUsersRouter(container.usersController, container.tokenService));
  router.use('/roles', createRolesRouter(container.rolesController, container.tokenService));
  router.use(
    '/scholarships',
    createScholarshipsRouter(container.scholarshipsController, container.tokenService),
  );
  router.use(
    '/deleted-items',
    createDeletedItemsRouter(container.deletedItemsController, container.tokenService),
  );

  // TODO: mount remaining modules as implemented
  router.use(
    '/colleges',
    createCollegesRouter(container.collegesController, container.authenticate),
  );
  router.use('/majors', createMajorsRouter(container.majorsController, container.authenticate));
  router.use('/content', createContentRouter(container.contentController, container.authenticate));
  // router.use('/notifications', createNotificationsRouter(container.notificationsController, container.authenticate));
  // router.use('/files',         createFilesRouter(container.filesController, container.authenticate));
  // router.use('/reviews',       createReviewsRouter(container.reviewsController, container.authenticate));
  // router.use('/contact',       createContactRouter(container.contactController));
 
  return router;
}
