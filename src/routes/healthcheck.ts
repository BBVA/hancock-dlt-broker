import { Router } from 'express';
import { healthCheckController } from '../controllers/healthcheck';

export const healthCheckRouter = Router();

healthCheckRouter
  .get('/', healthCheckController);
