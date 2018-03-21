import { NextFunction, Request, Response, Router } from 'express';

export function HealthCheckController(req: Request, res: Response, next: NextFunction) {

  res
    .status(200)
    .json({
      service: 'hancock-dlt-broker',
      success: true,
    });

}
