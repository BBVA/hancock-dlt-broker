import 'jest';
import * as url from 'url';
import {__consumerInstance__} from '../../domain/consumers/__mocks__/consumer';
import {getBitcoinClient} from '../../utils/bitcoin';
import {onError} from '../../utils/error';
import {validateSchema} from '../../utils/schema';
import * as bitcoinController from '../bitcoin';

jest.mock('url');
jest.mock('fs');
jest.mock('path');
jest.mock('../../utils/config');
jest.mock('../../domain/consumers/consumerFactory');
jest.mock('../../domain/consumers/consumer');
jest.mock('../../utils/bitcoin');
jest.mock('../../utils/logger');
jest.mock('../../utils/error');
jest.mock('../../utils/schema');

describe('bitcoinController', async () => {

  describe('SocketSubscribeController', async () => {
    let socket: any;
    let req: any;
    let spySubscribeTransactions: any;

    beforeEach(() => {

      socket = {
        on: jest.fn(),
        send: jest.fn(),
      };

      req = {};
      jest.clearAllMocks();

      spySubscribeTransactions = jest
        .spyOn(bitcoinController, '_subscribeTransactions')
        .mockImplementation(() => Promise.resolve(true));

    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

    it('should call SocketSubscribeController correctly', async () => {

      (url as any).parse = jest.fn().mockReturnValueOnce({
        query: {
          consumer: 'tests',
          sender: 'address',
        },
      });

      await bitcoinController.SocketSubscribeController(socket, req);

      expect(socket.on).toHaveBeenCalledTimes(2);
      expect(socket.send).toHaveBeenCalledTimes(1);
      expect(socket.send).toHaveBeenCalledWith(JSON.stringify({kind: 'ready'}));
      expect(spySubscribeTransactions).toHaveBeenCalledTimes(1);

    });

    it('should call on message correctly and subscribeTransactions only transfers', async () => {
      const request = {
        consumer: 'Consumer',
        kind: 'watch-transfers',
        body: ['address1'],
      };

      socket.on = jest.fn().mockImplementationOnce((kind, callbacks) => {
        callbacks();
      }).mockImplementationOnce((kind, callbacks) => {
        callbacks(JSON.stringify(request));
      });

      (url as any).parse = jest.fn().mockReturnValueOnce({
        query: {
          consumer: 'tests',
          sender: undefined,
        },
      });

      await bitcoinController.SocketSubscribeController(socket, req);

      expect(socket.on).toHaveBeenCalledTimes(2);
      expect(validateSchema).toHaveBeenCalledTimes(1);
      expect(spySubscribeTransactions).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledTimes(0);

    });

    it('should call on message correctly and subscribeTransactions', async () => {
      const request = {
        consumer: 'Consumer',
        kind: 'watch-transactions',
        body: ['address1'],
      };

      socket.on = jest.fn().mockImplementationOnce((kind, callbacks) => {
        callbacks();
      }).mockImplementationOnce((kind, callbacks) => {
        callbacks(JSON.stringify(request));
      });

      (url as any).parse = jest.fn().mockReturnValueOnce({
        query: {
          consumer: 'tests',
          sender: undefined,
        },
      });

      await bitcoinController.SocketSubscribeController(socket, req);

      expect(socket.on).toHaveBeenCalledTimes(2);
      expect(validateSchema).toHaveBeenCalledTimes(1);
      expect(spySubscribeTransactions).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledTimes(0);

    });

    it('should call on message correctly but kind of subscription is undefined', async () => {
      const request = {
        consumer: 'Consumer',
        kind: undefined,
        body: ['address1'],
      };

      socket.on = jest.fn().mockImplementationOnce((kind, callbacks) => {
        callbacks();
      }).mockImplementationOnce((kind, callbacks) => {
        callbacks(JSON.stringify(request));
      });

      (url as any).parse = jest.fn().mockReturnValueOnce({
        query: {
          consumer: 'tests',
          sender: undefined,
        },
      });

      await bitcoinController.SocketSubscribeController(socket, req);

      expect(socket.on).toHaveBeenCalledTimes(2);
      expect(validateSchema).toHaveBeenCalledTimes(0);
      expect(spySubscribeTransactions).toHaveBeenCalledTimes(0);
      expect(onError).toHaveBeenCalledTimes(1);

    });
  });

  describe('_subscribeTransactions', async () => {
    let socket: any;
    let bitcoinClient: any;
    let newBlock: any;
    let spyReactToNewTransfer: any;

    beforeEach(async () => {
      jest.clearAllMocks();

      socket = {
        on: jest.fn(),
        send: jest.fn(),
        terminate: jest.fn(),
      };

      newBlock = {
        hash: '000000f22152edb76673b5f6909e5693f786128760a3761c8a3ccd6b63a3ca45bd053c',
      };

      bitcoinClient = await getBitcoinClient();

      spyReactToNewTransfer = jest
        .spyOn((bitcoinController as any), '_reactToNewTransaction')
        .mockImplementation(() => Promise.resolve(true));
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

    it('should call _subscribeTransactions correctly', async () => {

      const addresses: string[] = ['address1'];
      bitcoinClient.socket.subscribeToNewBLocks = jest.fn().mockImplementation(() => {
        return {
          on: jest.fn().mockImplementationOnce(() => {
            return {
              on: jest.fn().mockImplementationOnce((message, callback) => {
                return callback(newBlock);
              }),
            };
          }),
        };
      });

      await bitcoinController._subscribeTransactions(socket, addresses, []);

      expect(spyReactToNewTransfer).toHaveBeenCalledTimes(addresses.length);
      expect(spyReactToNewTransfer).toHaveBeenCalledWith(socket, addresses[0], newBlock, __consumerInstance__, false);

    });

    it('should call _onError when an error event is triggered', async () => {

      const addresses: string[] = ['address1'];
      bitcoinClient.socket.subscribeToNewBLocks = jest.fn().mockImplementation(() => {
        return {
          on: jest.fn().mockImplementationOnce((event, callbackError) => {
            callbackError(new Error());
            return {
              on: jest.fn().mockImplementationOnce((message, callback) => {
                return true;
              }),
            };
          }),
        };
      });

      await bitcoinController._subscribeTransactions(socket, addresses, []);

      expect(onError).toHaveBeenCalledTimes(1);
      expect(spyReactToNewTransfer).toHaveBeenCalledTimes(0);

    });
  });

  describe('_reactToNewTransaction', async () => {
    let socket: any;
    let bitcoinClient: any;
    let newBlock: any;

    beforeEach(async () => {
      jest.clearAllMocks();

      socket = {
        on: jest.fn(),
        send: jest.fn(),
        terminate: jest.fn(),
      };

      newBlock = {
        hash: '000000f22152edb76673b5f6909e5693f786128760a3761c8a3ccd6b63a3ca45bd053c',
      };

      bitcoinClient = await getBitcoinClient();
    });

    afterAll(() => {
      jest.restoreAllMocks();
    });

    it('should notify to sender', async () => {

      const address = 'address1';
      const blockBody = {
        pagesTotal: 1,
        txs: [{
          txid: 'tx1',
          isCoinBase: false,
          vin: [
            {
              addr: address,
            },
            {
              addr: address,
            },
          ],
          vout: [{
            scriptPubKey: {
              addresses: ['address2'],
            },
          }],
        }],
      };
      bitcoinClient.api.getBlock = jest.fn().mockReturnValue(blockBody);

      await bitcoinController._reactToNewTransaction(socket, address, newBlock, __consumerInstance__, false);

      expect(__consumerInstance__.notify).toHaveBeenCalledTimes(2);
      expect(onError).toHaveBeenCalledTimes(0);

    });

    it('should notify to receiver', async () => {

      const address = 'address1';
      const blockBody = {
        pagesTotal: 1,
        txs: [{
          txid: 'tx1',
          isCoinBase: false,
          vin: [{
            addr: 'address2',
          }],
          vout: [{
            scriptPubKey: {
              addresses: [address],
            },
          }],
        }],
      };
      bitcoinClient.api.getBlock = jest.fn().mockReturnValue(blockBody);

      await bitcoinController._reactToNewTransaction(socket, address, newBlock, __consumerInstance__, false);

      expect(__consumerInstance__.notify).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledTimes(0);

    });

  });

});
