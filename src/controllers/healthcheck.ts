import { NextFunction, Request, Response, Router } from 'express';

export function HealthCheckController(req: Request, res: Response, next: NextFunction) {

  res
    .status(200)
    .json({
      success: true,
    });

}
