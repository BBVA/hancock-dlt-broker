import 'jest';
import logger from '../../utils/logger';
import * as errors from '../error';
import { hancockDefaultError, HancockError, IHancockErrorResponse } from './../../models/error';

jest.mock('../../utils/config');
jest.mock('../../utils/logger');

describe('errorController', async () => {

  beforeEach(() => {

    jest.clearAllMocks();

  });

  describe('::_getErrorResponse', () => {

    it('should return the correct error response given a HancockError', async () => {

      const error: HancockError = new HancockError('1111', 500, 'Custom error');

      const result: IHancockErrorResponse = await errors._getErrorResponse(error);

      expect(result).toEqual({
        error: 500,
        internalError: 'HKBR1111',
        message: 'Custom error',
      });

    });

    it('should return the default status code and error body when the given error is not matched', async () => {

      const extendedError: Error = new Error('Extended boom!');
      const error: HancockError = new HancockError('1111', 500, 'Custom error', extendedError);

      const result: IHancockErrorResponse = await errors._getErrorResponse(error);

      expect(result).toEqual({
        error: 500,
        internalError: 'HKBR1111',
        message: 'Custom error',
        extendedMessage: 'Error: Extended boom!',
      });

    });

  });

  describe('::errorController', () => {

    let req: any;
    let res: any;
    let next: any;
    let _getResponseMock: jest.Mock;
    const mockerErrorResponse: IHancockErrorResponse = {} as any;

    beforeEach(() => {

      req = {};

      res = {
        json: jest.fn(),
        status: jest.fn().mockImplementation(() => res),
      };

      next = jest.fn();

      _getResponseMock = jest.spyOn(errors, '_getErrorResponse').mockReturnValue(mockerErrorResponse);

    });

    it('should return the correct status code and error body given an specific error', async () => {

      const error: HancockError = new HancockError('1111', 500, 'Custom error');
      await errors.errorController(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(error.httpCode);
      expect(_getResponseMock).toHaveBeenCalledWith(error);
      expect(res.json).toHaveBeenCalledWith(mockerErrorResponse);
      expect(logger.error).toHaveBeenCalledWith(JSON.stringify(error, undefined, 2));

    });

    it('should return the default status code and error body when the given error is not matched', async () => {

      const error: Error = new Error('WHATEVER');
      await errors.errorController(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(hancockDefaultError.httpCode);
      expect(_getResponseMock).toHaveBeenCalledWith(hancockDefaultError);
      expect(res.json).toHaveBeenCalledWith(mockerErrorResponse);
      expect(logger.error).toHaveBeenCalledWith(JSON.stringify(hancockDefaultError, undefined, 2));

    });

  });

});
