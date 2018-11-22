import 'jest';
import {__consumerInstance__} from '../../domain/consumers/__mocks__/consumer';
import {HancockError, hancockGetBlockError} from '../../models/error';
import {error, onError} from '../error';
import {logger} from '../logger';

jest.mock('../../utils/logger');

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

describe('onError', () => {

  let socket: any;

  beforeEach(async () => {

    socket = {
      on: jest.fn(),
      send: jest.fn(),
      terminate: jest.fn(),
    };

  });

  it('should call consumer notify', async () => {

    await onError(socket, hancockGetBlockError, false, __consumerInstance__);

    expect(__consumerInstance__.notify).toHaveBeenCalledWith({ kind: 'error', body: hancockGetBlockError });
    expect(socket.terminate).not.toHaveBeenCalled();

  });

  it('should call socket send', async () => {

    await onError(socket, hancockGetBlockError, true);

    expect(socket.send).toHaveBeenCalledWith(JSON.stringify({ kind: 'error', body: hancockGetBlockError }));
    expect(socket.terminate).toHaveBeenCalled();

  });

  it('should call logger.error', async () => {

    socket.send = jest.fn().mockImplementationOnce(() => {
      throw new Error('Error!');
    });

    await onError(socket, hancockGetBlockError, true);

    expect(logger.error).toHaveBeenCalled();

  });

});
