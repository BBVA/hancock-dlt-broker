import { NextFunction, Request, Response, Router } from 'express';
import { HealthCheckController } from '../controllers/healthcheck';

export const HealthCheckRouter = Router();

HealthCheckRouter
  .get('/', HealthCheckController);
