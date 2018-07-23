import { NextFunction, Request, Response } from 'express';
import { errorController, Errors } from './error';

export function fallbackController(req: Request, res: Response, next: NextFunction) {

  return errorController({message: Errors.NOT_FOUND}, req, res, next);

}
