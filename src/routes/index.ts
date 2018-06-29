import { NextFunction, Request, Response, Router } from 'express';

import { errorController } from '../controllers/error';
import { fallbackController } from '../controllers/fallback';
import { healthCheckController } from '../controllers/healthcheck';
import { EthereumRouter } from './ethereum';

export const AppRouter = Router();

AppRouter
  .use('/health', healthCheckController)
  .use('/ethereum', EthereumRouter)
  .use(fallbackController)
  .use(errorController);
