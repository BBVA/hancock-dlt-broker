import { NextFunction, Request, Response, Router } from 'express';

export function healthCheckController(req: Request, res: Response, next: NextFunction) {

  res
    .status(200)
    .json({
      service: 'hancock-dlt-broker',
      success: true,
    });

}
