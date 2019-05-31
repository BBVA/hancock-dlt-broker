import 'jest';
import * as jwt from 'jsonwebtoken';
import * as request from 'request-promise-native';
import {v4 as uuidv4} from 'uuid';
import {IEthereumProviderModel, IJwtModel} from '../../../models/ethereum';
import {CONSUMER_EVENT_KINDS, ISocketEvent} from '../../../models/models';
import {PROTOCOLS} from '../../../types';
import config from '../../../utils/config';
import {Consumer} from '../consumer';
import {hancockEncryptError, hancockGetConsumerTokenError, hancockGetWalletError} from '../models/error';
import {ISecureEventTxDirection, SecureConsumer} from '../secureConsumer';

jest.mock('request-promise-native');
jest.mock('jsonwebtoken');
jest.mock('uuid');
jest.mock('../../../utils/config');
jest.mock('../../../utils/logger');
jest.mock('../../../utils/error');

describe('secureConsumer', () => {

  let webSocket: any;
  let testConsumer: any;
  let event: ISocketEvent;
  let providerData: IEthereumProviderModel;
  let jwtData: IJwtModel;

  beforeEach(() => {

    webSocket = {
      send: jest.fn(),
    };

    event = {
      body: {
        from: '0x1',
        to: '0x0',
      },
      raw: {
        from: '0x1',
        to: '0x0',
      },
      kind: CONSUMER_EVENT_KINDS.Transaction,
      matchedAddress: '0x0',
    };
    jwtData = {
      key: 'mockkey',
      secret: 'mocksecret',
      expires_in: 'mockexpires',
    };
    providerData = {
      providerName: 'SecureConsumer',
      protocol: PROTOCOLS.SECURE,
      singEndPoint: '',
      jwt: jwtData,
      recoverPkEndPoint: 'http://localhost:8080',
    };

    testConsumer = new SecureConsumer(webSocket as any, providerData);
    jest.restoreAllMocks();
  });

  it('should call cypherAndSendTransfer method on notify of tx', async () => {

    const spy = jest.spyOn((SecureConsumer.prototype as any), 'cypherAndSendTransfer')
      .mockImplementation(() => Promise.resolve(true));
    await testConsumer.notify(event);
    expect(spy).toHaveBeenCalledWith(event);
  });

  it('should call cypherAndSendTransfer method on notify of not tx', async () => {

    event.kind = 'log';

    const spy = jest.spyOn(Consumer.prototype, 'notify')
      .mockImplementation(() => Promise.resolve(true));
    await testConsumer.notify(event);
    expect(spy).toHaveBeenCalledWith(event);
  });

  it('should call cypherAndSendTransfer method successfully', async () => {

    const response = {
      data: {
        item_id: 'mockid',
        public_key: 'mockKey',
      },
      result: {
        description: 'mockdes',
        internal_code: 'mockcode',
        status_code: 200,
      },
    };
    (request.get as any) = jest.fn().mockReturnValue(response);

    const getTokenspy = jest.spyOn((SecureConsumer.prototype as any), 'getToken')
      .mockImplementation(() => Promise.resolve('whatever'));
    const getTxDirectionspy = jest.spyOn((SecureConsumer.prototype as any), 'getTxDirection')
      .mockImplementation(() => Promise.resolve('whatever'));
    const spy = jest.spyOn(Consumer.prototype, 'notify')
      .mockImplementation(() => Promise.resolve(true));

    await (testConsumer as any).cypherAndSendTransfer(event);

    expect(getTokenspy).toHaveBeenCalledTimes(1);
    expect(getTxDirectionspy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should call cypherAndSendTransfer method and throw exception', async () => {

    const response = {
      data: {
        item_id: 'mockid',
        public_key: 'mockKey',
      },
      result: {
        description: 'mockdes',
        internal_code: 'mockcode',
        status_code: 500,
      },
    };
    (request.get as any) = jest.fn().mockReturnValue(response);

    jest.spyOn((SecureConsumer.prototype as any), 'getToken')
      .mockImplementation(() => Promise.resolve('whatever'));
    jest.spyOn((SecureConsumer.prototype as any), 'getTxDirection')
      .mockImplementation(() => Promise.resolve('whatever'));
    jest.spyOn(Consumer.prototype, 'notify')
      .mockImplementation(() => Promise.resolve(true));

    try {
      await (testConsumer as any).cypherAndSendTransfer(event);
      fail('it should fail');
    } catch (error) {
      expect(error).toEqual(hancockGetWalletError);
    }
  });

  // FIX this after refactor and decide what to do with error in cryptvault

  // it('should call cypherAndSendTransfer method and throw exception when request fail', async () => {

  //   (request.get as any) = jest.fn().mockRejectedValue(hancockDefaultError);

  //   const getTokenspy = jest.spyOn((SecureConsumer.prototype as any), 'getToken')
  //   .mockImplementation(() => Promise.resolve('whatever'));

  //   try {
  //     await (testConsumer as any).cypherAnsdSendTransfer(event);
  //     fail('it should fail');
  //   } catch (error) {
  //     expect(error).toEqual(hancockGetConsumerPKError);
  //   }
  // });

  it('should call cypherAndSendTransfer method and throw exception when encrypt fails', async () => {

    const response = {
      data: {
        item_id: 'mockid',
        public_key: 'mockKey',
      },
      result: {
        description: 'mockdes',
        internal_code: 'mockcode',
        status_code: 200,
      },
    };
    (request.get as any) = jest.fn().mockReturnValue(response);

    jest.spyOn((SecureConsumer.prototype as any), 'getToken')
      .mockImplementation(() => Promise.resolve('whatever'));
    jest.spyOn((SecureConsumer.prototype as any), 'getTxDirection')
      .mockImplementation(() => {
        throw new Error('Error!');
      });
    jest.spyOn(Consumer.prototype, 'notify')
      .mockImplementation(() => Promise.resolve(true));

    try {
      await (testConsumer as any).cypherAndSendTransfer(event);
      fail('it should fail');
    } catch (error) {
      expect(error).toEqual(hancockEncryptError);
    }
  });

  it('should call getTxDirection method successfully and return 0', () => {
    const response = (testConsumer as any).getTxDirection(event);
    expect(response).toEqual(ISecureEventTxDirection.IN);
  });

  it('should call getTxDirection method successfully and return 1', () => {
    event.matchedAddress = '0x1';
    const response = (testConsumer as any).getTxDirection(event);
    expect(response).toEqual(ISecureEventTxDirection.OUT);
  });

  it('should call getTxDirection method successfully and return 0', () => {

    (testConsumer as any).getToken();
    expect(jwt.sign).toHaveBeenCalledTimes(1);
    expect(jwt.sign).toHaveBeenCalledWith(
      {
        iss: config.consumers.cryptvault.credentials.key,
        txid: uuidv4(),
      },
      config.consumers.cryptvault.credentials.secret,
      {expiresIn: config.consumers.cryptvault.credentials.expires_in},
    );
  });

  it('should call getTxDirection method successfully and throw exception', () => {

    (jwt.sign as any) = jest.fn().mockImplementationOnce(() => {
      throw new Error('Error!');
    });

    try {

      (testConsumer as any).getToken();

    } catch (error) {

      expect(error).toEqual(hancockGetConsumerTokenError);

    }
  });

});
