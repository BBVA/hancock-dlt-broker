import { NextFunction, Request, Response } from 'express';
import config from '../utils/config';

export function healthCheckController(req: Request, res: Response, next: NextFunction) {

  res
    .status(200)
    .json({
      app: config.application,
      success: true,
    });

}
