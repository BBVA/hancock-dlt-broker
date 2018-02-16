import { NextFunction, Request, Response, Router } from 'express';
import { SubscribeController } from '../controllers/ethereum';

export const EthereumRouter = Router();

EthereumRouter
  .get('/subscribe', SubscribeController);
