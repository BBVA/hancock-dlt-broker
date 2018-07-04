import { Router } from 'express';
import { healthCheckController } from '../controllers/healthcheck';

export const HealthCheckRouter = Router();

HealthCheckRouter
  .get('/', healthCheckController);
