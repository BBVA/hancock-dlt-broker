import { NextFunction, Request, Response } from 'express';
import { hancockDefaultError, HancockError, IHancockErrorResponse } from '../models/error';
import logger from '../utils/logger';

export const _getErrorResponse = (e: HancockError): IHancockErrorResponse => {

  const response: IHancockErrorResponse = {
    error: e.httpCode,
    internalError: e.internalCode,
    message: e.message,
  };

  if (e.extendedMessage) {
    response.extendedMessage = e.extendedMessage;
  }

  return response;

};

export function errorController(err: Error, req: Request, res: Response, next: NextFunction) {

  const customError: HancockError = err instanceof HancockError ? err : hancockDefaultError;

  logger.error(customError);

  return res
    .status(customError.httpCode)
    .json(_getErrorResponse(customError));

}
