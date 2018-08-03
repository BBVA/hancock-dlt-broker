import { NextFunction, Request, Response } from 'express';

export interface ICustomError {
  code_internal: string;
  code_http: number;
  message: string;
}

export interface IErrorMap {
  [k: string]: ICustomError;
}

export enum Errors {
  DEFAULT_ERROR = 'DEFAULT_ERROR',
  NOT_FOUND = 'NOT_FOUND',
}

export const errorMap: IErrorMap = {
  DEFAULT_ERROR: { code_internal: 'DC4000', code_http: 400, message: 'Bad request' },
  NOT_FOUND: { code_internal: 'DC4040', code_http: 404, message: 'Not Found' },
};

export function errorController(error: any, req: Request, res: Response, next: NextFunction) {

  const customError: ICustomError = errorMap[error.message] || errorMap[Errors.DEFAULT_ERROR];
  // const logger = loggerUtils.getLogger(customError.code_internal);

  console.log('-----------------------------------------------------------------------');
  console.error(customError.message);
  console.error(error);
  console.log('-----------------------------------------------------------------------');

  return res
    .status(customError.code_http)
    .json(customError);

}
