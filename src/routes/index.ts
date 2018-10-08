import { Router } from 'express';

import { errorController } from '../controllers/error';
import { fallbackController } from '../controllers/fallback';
import { healthCheckController } from '../controllers/healthcheck';

/* istanbul ignore next */
export const appRouter = Router();

/* istanbul ignore next */
appRouter
  .use('/health', healthCheckController)
  .use(fallbackController)
  .use(errorController);
