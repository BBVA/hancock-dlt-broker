import 'jest';
import { HancockError } from '../../models/error';
import { error } from '../error';

describe('error', () => {

  const testError = new HancockError('12345', 'Test Error Suite');
  const testError2 = new HancockError('1234', 'Test Error Suite 2');

  it('should return a new hancock error with the original error in extendedError', async () => {

    const newError: HancockError = error(testError, new Error('test Error'));

    expect(newError.internalCode).toBe(testError.internalCode);
    expect(newError.message).toBe(testError.message);
    expect(newError.extendedMessage).toBe('Error: test Error');

  });

  it('should return a new hancock error with the original error in extendedError', async () => {

    const newError: HancockError = error(testError, testError2);

    expect(newError.internalCode).toBe(testError2.internalCode);
    expect(newError.message).toBe(testError2.message);
    expect(newError.errorStack[0]).toEqual(testError);

  });
});
