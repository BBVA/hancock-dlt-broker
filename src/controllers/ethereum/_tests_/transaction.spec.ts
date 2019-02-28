import 'jest';
import * as url from 'url';
import { __consumerInstance__ } from '../../../domain/consumers/__mocks__/consumer';
import { findOne } from '../../../domain/ethereum';
import {
  HancockError,
  hancockGetBlockError,
  hancockGetCodeError,
  hancockSubscribeToTransferError,
  hancockTransactionError,
} from '../../../models/error';
import {error, onError} from '../../../utils/error';
import * as Ethereum from '../../../utils/ethereum';
import * as transactionController from '../transaction';

jest.mock('url');
jest.mock('fs');
jest.mock('path');
jest.mock('../../../utils/config');
jest.mock('../../../domain/consumers/consumerFactory');
jest.mock('../../../domain/consumers/consumer');
jest.mock('../../../utils/ethereum');
jest.mock('../../../utils/logger');
jest.mock('../../../utils/error');
jest.mock('../../../utils/schema');

describe('transactionController', () => {

  let socket: any;
  let req: any;
  let example: any;
  let web3: any;
  let newBlock: any;
  let blockBody: any;
  const hash = '0xf22152edb76673b5f6909e5693f786128760a3761c8a3ccd6b63a3ca45bd053c';

  const socketId = 'socketId';
  const address = 'address';

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.restoreAllMocks();

    socket = {
      on: jest.fn(),
      send: jest.fn(),
      terminate: jest.fn(),
    };

    req = {};

    example = {
      body: {},
      consumer: 'Consumer',
      kind: 'watch-contracts',
    };

    web3 = await Ethereum.getWeb3();
    newBlock = {
      hash,
    };

    blockBody = {
      transactions: [
        {
          from: 'from',
          hash: 'hash',
          to: 'to',
        },
      ],
    };

    web3.eth.subscribe = jest.fn().mockImplementation(() => {
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
  });

  describe('_subscribeTransactionsController', () => {

    let isSubscribed: any;
    let createTransactionEventEmitterPending: any;
    let createTransactionEventEmitterMined: any;
    const status = 'mined';
    const uuid = 'uuid';

    beforeEach(() => {

      jest.clearAllMocks();

      isSubscribed = jest
        .spyOn((transactionController as any), '_isSubscribed')
        .mockImplementation(() => false);

      createTransactionEventEmitterPending = jest
        .spyOn((transactionController as any), '_createTransactionEventEmitterPending')
        .mockImplementation(() => Promise.resolve(true));

      createTransactionEventEmitterMined = jest
        .spyOn((transactionController as any), '_createTransactionEventEmitterMined')
        .mockImplementation(() => Promise.resolve(true));

    });

    afterAll(() => {

      isSubscribed.mockRestore();
      createTransactionEventEmitterPending.mockRestore();
      createTransactionEventEmitterMined.mockRestore();
      transactionController._removeAddressFromSocket(uuid);

    });

    it('should call _subscribeTransactionsController correctly and call createTransactionEventEmitterMined', async () => {

      await transactionController.subscribeTransactionsController(socket, uuid, status, ['from'], web3);

      expect(createTransactionEventEmitterMined).toHaveBeenCalledWith( web3);
      expect(createTransactionEventEmitterPending).not.toHaveBeenCalled();

    });

    it('should call _subscribeTransactionsController correctly and call createTransactionEventEmitterPending', async () => {

      await transactionController.subscribeTransactionsController(socket, uuid, 'pending', ['from'], web3);

      expect(createTransactionEventEmitterPending).toHaveBeenCalledWith( web3);
      expect(createTransactionEventEmitterMined).not.toHaveBeenCalled();

    });

    it('should call _subscribeTransactionsController and onError in web3 fail', async () => {

      createTransactionEventEmitterMined = jest
        .spyOn((transactionController as any), '_createTransactionEventEmitterMined')
        .mockImplementationOnce(() => { throw new Error('Error!'); });

      await transactionController.subscribeTransactionsController(socket, uuid, status, ['from'], web3);

      expect(onError).toHaveBeenCalledWith(socket, error(hancockSubscribeToTransferError, new Error('Error!')), false, __consumerInstance__);

    });

  });

  describe('_removeAddressFromSocket', () => {

    beforeEach(() => {

      jest.clearAllMocks();

      transactionController.transactionSubscriptionList.push({
        socketId,
      });
    });

    afterAll(() => {
      transactionController._removeAddressFromSocket(socketId);
    });

    it('should call _removeAddressFromSocket correctly', async () => {

      expect(transactionController.transactionSubscriptionList.length).toBe(1);
      transactionController._removeAddressFromSocket(socketId);
      expect(transactionController.transactionSubscriptionList.length).toBe(0);

    });

    it('should call _removeAddressFromSocket and remove nothing', async () => {

      expect(transactionController.transactionSubscriptionList.length).toBe(1);
      transactionController._removeAddressFromSocket('randomValue');
      expect(transactionController.transactionSubscriptionList.length).toBe(1);

    });

  });

  describe('_createTransactionEventEmitterMined', () => {

    it('should call _createTransactionEventEmitterMined correctly and subscribe', async () => {

      transactionController._createTransactionEventEmitterMined(web3);
      expect(web3.eth.subscribe).toHaveBeenCalledWith('newBlockHeaders');

    });

  });

  describe('_createTransactionEventEmitterPending', () => {

    it('should call _createTransactionEventEmitterPending correctly and subscribe', async () => {

      transactionController._createTransactionEventEmitterPending(web3);
      expect(web3.eth.subscribe).toHaveBeenCalledWith('pendingTransactions');

    });

  });

  describe('_isSubscribed', () => {
    beforeEach(() => {

      jest.clearAllMocks();

      transactionController.transactionSubscriptionList.push({
        socketId,
        address,
      });
    });

    afterAll(() => {
      transactionController._removeAddressFromSocket(socketId);
    });

    it('should call _isSubscribed correctly and return true', async () => {

      web3.eth.getBlock = jest.fn().mockResolvedValueOnce(blockBody);

      const response = transactionController._isSubscribed(transactionController.transactionSubscriptionList, address, socketId);

      expect(response).toBe(true);

    });

    it('should call _isSubscribed correctly and return false', async () => {

      web3.eth.getBlock = jest.fn().mockResolvedValueOnce(blockBody);

      const response = transactionController._isSubscribed(transactionController.transactionSubscriptionList, 'randomValue', socketId);

      expect(response).toBe(false);

    });

    it('should call _isSubscribed correctly and return false 2', async () => {

      web3.eth.getBlock = jest.fn().mockResolvedValueOnce(blockBody);

      const response = transactionController._isSubscribed(transactionController.transactionSubscriptionList, address, 'randomValue');

      expect(response).toBe(false);

    });

  });

  describe('_reactToNewPendingTransaction', () => {

    let processOnError: any;
    let _reactToTx: any;
    beforeEach(() => {

      jest.clearAllMocks();

      processOnError = jest
        .spyOn((transactionController as any), '_processOnError')
        .mockImplementation(() => false);

      _reactToTx = jest
        .spyOn((transactionController as any), '_reactToTx')
        .mockImplementationOnce(() => false);
    });

    it('should call _reactToNewPendingTransaction correctly', async () => {

      web3.eth.getTransaction = jest.fn().mockResolvedValueOnce(blockBody.transactions[0]);

      await transactionController._reactToNewPendingTransaction(web3, hash);

      expect(web3.eth.getTransaction).toHaveBeenCalledWith(hash, true);
      expect(_reactToTx).toHaveBeenCalledWith(web3, blockBody.transactions[0], 'pending');

    });

    it('should call _reactToNewPendingTransaction and onError in getTransaction fail', async () => {

      web3.eth.getTransaction = jest.fn().mockImplementationOnce(() => { throw new Error('Error!'); });

      await transactionController._reactToNewPendingTransaction(web3, hash);

      expect(web3.eth.getTransaction).toHaveBeenCalledWith(hash, true);
      expect(processOnError).toHaveBeenCalledWith(error(hancockTransactionError, new Error('Error!')), false);

    });

  });

  describe('_reactToNewBlock', () => {

    let processOnError: any;
    let _reactToTx: any;
    beforeEach(() => {

      jest.clearAllMocks();

      processOnError = jest
        .spyOn((transactionController as any), '_processOnError')
        .mockImplementation(() => false);

      _reactToTx = jest
        .spyOn((transactionController as any), '_reactToTx')
        .mockImplementation(() => false);
    });

    it('should call _reactToNewBlock correctly', async () => {

      web3.eth.getBlock = jest.fn().mockResolvedValueOnce(blockBody);

      await transactionController._reactToNewBlock(web3, newBlock);

      expect(web3.eth.getBlock).toHaveBeenCalledWith(newBlock.hash, true);
      expect(_reactToTx).toHaveBeenCalledWith(web3, blockBody.transactions[0], 'mined');

    });

    it('should call _reactToNewBlock and onError in getBlock fail', async () => {

      web3.eth.getBlock = jest.fn().mockImplementationOnce(() => { throw new Error('Error!'); });

      await transactionController._reactToNewBlock(web3, newBlock);

      expect(web3.eth.getBlock).toHaveBeenCalledWith(newBlock.hash, true);
      expect(processOnError).toHaveBeenCalledWith(error(hancockGetBlockError, new Error('Error!')), false);

    });

  });

  describe('_reactToTx', () => {

    let isSmartContractTransaction: any;

    beforeAll(() => {
      transactionController._removeAddressFromSocket(socketId);
    });

    afterEach(() => {
      transactionController._removeAddressFromSocket(socketId);
    });

    it('should call _reactToTx correctly', async () => {

      const obj = {
        socketId,
        address: blockBody.transactions[0].from,
        consumer: {
          notify: jest.fn().mockImplementationOnce(() => true),
        },
        socket: 'socket',
        status: 'mined',
        onlyTransfers: false,
      };
      transactionController.transactionSubscriptionList.push(obj);

      isSmartContractTransaction = jest
        .spyOn((transactionController as any), '_isSmartContractTransaction')
        .mockImplementation(() => false);

      await transactionController._reactToTx(web3, blockBody.transactions[0], 'mined');

      expect(isSmartContractTransaction).toHaveBeenCalledWith(obj.socket, obj.consumer, web3, blockBody.transactions[0]);
      expect(obj.consumer.notify).toHaveBeenCalledWith({ kind: 'tx', body: blockBody.transactions[0], matchedAddress: blockBody.transactions[0].from });

    });

    it('should call _reactToTx correctly with matching to', async () => {

      const obj = {
        socketId,
        address: blockBody.transactions[0].to,
        consumer: {
          notify: jest.fn().mockImplementationOnce(() => true),
        },
        socket: 'socket',
        status: 'mined',
        onlyTransfers: false,
      };

      isSmartContractTransaction = jest
        .spyOn((transactionController as any), '_isSmartContractTransaction')
        .mockImplementation(() => false);

      transactionController.transactionSubscriptionList.push(obj);

      await transactionController._reactToTx(web3, blockBody.transactions[0], 'mined');

      expect(obj.consumer.notify).toHaveBeenCalledWith({ kind: 'tx', body: blockBody.transactions[0], matchedAddress: blockBody.transactions[0].to });

    });

    it('should call _reactToTx correctly and not notify', async () => {

      const obj = {
        socketId,
        address: blockBody.transactions[0].to,
        consumer: {
          notify: jest.fn().mockImplementationOnce(() => true),
        },
        socket: 'socket',
        status: 'mined',
        onlyTransfers: false,
      };

      isSmartContractTransaction = jest
        .spyOn((transactionController as any), '_isSmartContractTransaction')
        .mockImplementation(() => false);

      transactionController.transactionSubscriptionList.push(obj);

      await transactionController._reactToTx(web3, blockBody.transactions[0], 'pending');

      expect(obj.consumer.notify).not.toHaveBeenCalled();

    });

    it('should call _reactToTx correctly with pending and notify', async () => {

      const obj = {
        socketId,
        address: blockBody.transactions[0].to,
        consumer: {
          notify: jest.fn().mockImplementationOnce(() => true),
        },
        socket: 'socket',
        status: 'pending',
        onlyTransfers: false,
      };

      isSmartContractTransaction = jest
        .spyOn((transactionController as any), '_isSmartContractTransaction')
        .mockImplementation(() => false);

      transactionController.transactionSubscriptionList.push(obj);

      await transactionController._reactToTx(web3, blockBody.transactions[0], 'pending');

      expect(obj.consumer.notify).toHaveBeenCalledWith({ kind: 'tx', body: blockBody.transactions[0], matchedAddress: blockBody.transactions[0].to });
    });

  });

  describe('_isSmartContractTransaction', () => {

    let processOnError: any;
    beforeEach(() => {

      jest.clearAllMocks();

      processOnError = jest
        .spyOn((transactionController as any), '_processOnError')
        .mockImplementation(() => false);

    });

    it('should call _isSmartContractTransaction correctly and return true', async () => {

      blockBody.transactions[0].to = null;
      const response = await transactionController._isSmartContractTransaction(socket, example.consumer, web3, blockBody.transactions[0]);

      expect(response).toBe(true);

    });

    it('should call _isSmartContractTransaction correctly and return true 2', async () => {

      web3.eth.getCode = jest.fn().mockImplementationOnce(() => '0x');
      const response = await transactionController._isSmartContractTransaction(socket, example.consumer, web3, blockBody.transactions[0]);

      expect(response).toBe(false);

    });

    it('should call _isSmartContractTransaction correctly and return false', async () => {

      web3.eth.getCode = jest.fn().mockImplementationOnce(() => '0x1234');
      const response = await transactionController._isSmartContractTransaction(socket, example.consumer, web3, blockBody.transactions[0]);

      expect(response).toBe(true);

    });

    it('should call _isSmartContractTransaction with error', async () => {

      web3.eth.getCode = jest.fn().mockImplementationOnce(() => { throw new Error('Error!'); });
      const response = await transactionController._isSmartContractTransaction(socket, example.consumer, web3, blockBody.transactions[0]);

      expect(onError).toHaveBeenCalledWith(socket, error(hancockGetCodeError, new Error('Error!')), false, example.consumer);

    });

  });

  describe('_processOnError', () => {

    beforeEach(() => {

      jest.clearAllMocks();

    });

    it('should call _processOnError correctly', async () => {

      const obj = {
        socketId,
        address: blockBody.transactions[0].to,
        consumer: {
          notify: jest.fn().mockImplementationOnce(() => true),
        },
        socket: 'socket',
        status: 'mined',
        onlyTransfers: false,
      };

      transactionController.transactionSubscriptionList.push(obj);

      transactionController._processOnError(hancockGetCodeError, false);

      expect(onError).toHaveBeenCalledWith(obj.socket, hancockGetCodeError, false, obj.consumer);

    });

  });

  describe('unsubscribeTransactionsController', () => {

    beforeEach(() => {

      jest.clearAllMocks();
      transactionController._removeAddressFromSocket(socketId);

      transactionController.transactionSubscriptionList.push({
        socketId,
        address: 'address',
        status: 'mined',
        onlyTransfers: false,
      },
      {
        socketId,
        address: 'address2',
        status: 'mined',
        onlyTransfers: false,
      });
    });

    afterAll(() => {
      transactionController._removeAddressFromSocket(socketId);
    });

    it('should call unsubscribeTransactionsController correctly', async () => {

      expect(transactionController.transactionSubscriptionList.length).toBe(2);
      transactionController.unsubscribeTransactionsController(socketId, 'mined', ['address']);
      expect(transactionController.transactionSubscriptionList.length).toBe(1);

    });

    it('should call unsubscribeTransactionsController and remove nothing', async () => {

      expect(transactionController.transactionSubscriptionList.length).toBe(2);
      transactionController.unsubscribeTransactionsController(socketId, 'mined', ['address3']);
      expect(transactionController.transactionSubscriptionList.length).toBe(2);

    });

  });

});
