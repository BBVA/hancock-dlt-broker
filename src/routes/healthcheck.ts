import { Router } from 'express';
import { healthCheckController } from '../controllers/healthcheck';

/* istanbul ignore next */
export const healthCheckRouter = Router();

/* istanbul ignore next */
healthCheckRouter
  .get('/', healthCheckController);
