import { NextFunction, Request, Response, Router } from 'express';

import { ErrorController } from '../controllers/error';
import { FallbackController } from '../controllers/fallback';
import { HealthCheckController } from '../controllers/healthcheck';
import { EthereumRouter } from './ethereum';

export const AppRouter = Router();

AppRouter
  .use('/health', HealthCheckController)
  .use('/ethereum', EthereumRouter)
  .use(FallbackController)
  .use(ErrorController);
