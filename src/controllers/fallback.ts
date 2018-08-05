import { NextFunction, Request, Response } from 'express';
import { hancockNotFoundError } from '../models/error';
import { errorController } from './error';

export function fallbackController(req: Request, res: Response, next: NextFunction) {

  return errorController(hancockNotFoundError, req, res, next);

}
