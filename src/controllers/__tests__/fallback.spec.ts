
import 'jest';
import { hancockNotFoundError } from '../../models/error';
import { errorController } from '../error';
import { fallbackController } from '../fallback';

jest.mock('../error');

describe('fallbackController', async () => {
  const req: any = {};
  const res: any = {};
  const next: any = {};

  it('should call the error controller passing NOT_FOUND error argument', async () => {

    await fallbackController(req, res, next);

    expect(errorController).toHaveBeenCalledWith(hancockNotFoundError, req, res, next);

  });

});
