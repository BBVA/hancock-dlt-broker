import { NextFunction, Request, Response, Router } from 'express';
import { errorController, Errors } from './error';

export function fallbackController(req: Request, res: Response, next: NextFunction) {

  return errorController({message: Errors.NOT_FOUND}, req, res, next);

}
