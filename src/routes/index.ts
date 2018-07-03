import { Router } from 'express';

import { errorController } from '../controllers/error';
import { fallbackController } from '../controllers/fallback';
import { healthCheckController } from '../controllers/healthcheck';

export const AppRouter = Router();

AppRouter
  .use('/health', healthCheckController)
  .use(fallbackController)
  .use(errorController);
