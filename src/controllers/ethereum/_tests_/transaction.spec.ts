import 'jest';
import {__consumerInstance__} from '../../../domain/consumers/__mocks__/consumer';
import {hancockGetCodeError, hancockSubscribeToTransferError, hancockTransactionError} from '../../../models/error';
import {CONSUMER_EVENT_KINDS, ISocketMessageStatus, MESSAGE_STATUS} from '../../../models/models';
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
    const status = MESSAGE_STATUS.Mined;
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

    });

    it('should call _subscribeTransactionsController correctly and call createTransactionEventEmitterMined', async () => {

      await transactionController.subscribeTransactionsController(socket, uuid, status, ['from'], web3, CONSUMER_EVENT_KINDS.Transaction);

      expect(createTransactionEventEmitterMined).toHaveBeenCalledWith(web3);
      expect(createTransactionEventEmitterPending).not.toHaveBeenCalled();

    });

    it('should call _subscribeTransactionsController correctly and call createTransactionEventEmitterPending', async () => {

      await transactionController.subscribeTransactionsController(socket, uuid, MESSAGE_STATUS.Pending, ['from'], web3, CONSUMER_EVENT_KINDS.Transaction);

      expect(createTransactionEventEmitterPending).toHaveBeenCalledWith(web3);
      expect(createTransactionEventEmitterMined).not.toHaveBeenCalled();

    });

    it('should call _subscribeTransactionsController and onError in web3 fail', async () => {

      createTransactionEventEmitterMined = jest
        .spyOn((transactionController as any), '_createTransactionEventEmitterMined')
        .mockImplementationOnce(() => {
          throw new Error('Error!');
        });

      await transactionController.subscribeTransactionsController(socket, uuid, status, ['from'], web3, CONSUMER_EVENT_KINDS.Transaction);

      expect(onError).toHaveBeenCalledWith(socket, error(hancockSubscribeToTransferError, new Error('Error!')), false, __consumerInstance__);

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
    let status: ISocketMessageStatus;

    beforeEach(() => {

      jest.clearAllMocks();

      status = MESSAGE_STATUS.Mined;
      transactionController.transactionSubscriptionList.push({
        socketId,
        address,
        eventKind: CONSUMER_EVENT_KINDS.Transaction,
        status,
      });
    });

    it('should call _isSubscribed correctly and return true', async () => {

      web3.eth.getBlock = jest.fn().mockResolvedValueOnce(blockBody);

      const response = transactionController._isSubscribed(
        transactionController.transactionSubscriptionList,
        address,
        socketId,
        CONSUMER_EVENT_KINDS.Transaction,
        status,
      );

      expect(response).toBe(true);

    });

    it('should call _isSubscribed correctly and return false', async () => {

      web3.eth.getBlock = jest.fn().mockResolvedValueOnce(blockBody);

      const response = transactionController._isSubscribed(
        transactionController.transactionSubscriptionList,
        address,
        socketId,
        CONSUMER_EVENT_KINDS.Transfer,
        status,
      );

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
      expect(_reactToTx).toHaveBeenCalledWith(web3, blockBody.transactions[0], MESSAGE_STATUS.Pending);

    });

    it('should call _reactToNewPendingTransaction and onError in getTransaction fail', async () => {

      web3.eth.getTransaction = jest.fn().mockImplementationOnce(() => {
        throw new Error('Error!');
      });

      await transactionController._reactToNewPendingTransaction(web3, hash);

      expect(web3.eth.getTransaction).toHaveBeenCalledWith(hash, true);
      expect(processOnError).toHaveBeenCalledWith(error(hancockTransactionError, new Error('Error!')), false);

    });

  });

  describe('_reactToNewBlock', () => {

    let processOnError: any;
    let _reactToTx: any;
    let _getBlock: any;
    beforeEach(() => {

      jest.clearAllMocks();

      processOnError = jest
        .spyOn((transactionController as any), '_processOnError')
        .mockImplementation(() => false);

      _reactToTx = jest
        .spyOn((transactionController as any), '_reactToTx')
        .mockImplementation(() => false);

      _getBlock = jest
        .spyOn((transactionController as any), '_getBlock')
        .mockImplementation(() => false);
    });

    it('should call _reactToNewBlock correctly', async () => {

      _getBlock.mockResolvedValueOnce(blockBody);

      await transactionController._reactToNewBlock(web3, newBlock);

      expect(_getBlock).toHaveBeenCalledWith(web3, newBlock);
      expect(_reactToTx).toHaveBeenCalledWith(web3, blockBody.transactions[0]);

    });

    it('should call _reactToNewBlock and onError in getBlock fail', async () => {
      _getBlock.mockImplementationOnce(() => {
        throw new Error('Error!');
      });

      await transactionController._reactToNewBlock(web3, newBlock);

      expect(_getBlock).toHaveBeenCalledWith(web3, newBlock);
      expect(processOnError).toHaveBeenCalledWith(new Error('Error!'), false);

    });

  });

  describe('_reactToTx', () => {
    let _notifyConsumer: any;
    let status: ISocketMessageStatus;
    let matchedAddress: string;

    beforeEach(() => {
      status = MESSAGE_STATUS.Mined;

      jest.clearAllMocks();
      transactionController._cleantransactionSubscriptionList();

      _notifyConsumer = jest
        .spyOn((transactionController as any), '_notifyConsumer')
        .mockImplementation(() => false);
    });

    it('should call _reactToTx correctly and notify 1 times when from address match', async () => {
      matchedAddress = 'from';

      const obj = {
        address: matchedAddress,
        status,
      };
      transactionController.transactionSubscriptionList.push(obj);

      await transactionController._reactToTx(web3, blockBody.transactions[0], status);

      expect(_notifyConsumer).toHaveBeenCalledWith(obj.address, blockBody.transactions[0], obj, web3);

    });

    it('should call _reactToTx correctly and notify 1 times when to address match', async () => {
      matchedAddress = 'to';

      const obj = {
        address: matchedAddress,
        status,
      };
      transactionController.transactionSubscriptionList.push(obj);

      await transactionController._reactToTx(web3, blockBody.transactions[0], status);

      expect(_notifyConsumer).toHaveBeenCalledWith(obj.address, blockBody.transactions[0], obj, web3);

    });

    it('should call _reactToTx correctly but it does not notify when address does not match', async () => {
      matchedAddress = 'do not match';

      const obj = {
        address: matchedAddress,
        status,
      };
      transactionController.transactionSubscriptionList.push(obj);

      await transactionController._reactToTx(web3, blockBody.transactions[0], status);

      expect(_notifyConsumer).not.toHaveBeenCalled();

    });

    it('should call _reactToTx correctly but it does not notify when status is not in any transaction', async () => {
      matchedAddress = 'from';
      const otherStatus = MESSAGE_STATUS.Pending;

      const obj = {
        address: matchedAddress,
        status,
      };
      transactionController.transactionSubscriptionList.push(obj);

      await transactionController._reactToTx(web3, blockBody.transactions[0], otherStatus);

      expect(_notifyConsumer).not.toHaveBeenCalled();

    });

  });

  describe('_isSmartContractTransaction', () => {

    beforeEach(() => {

      jest.clearAllMocks();

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

      web3.eth.getCode = jest.fn().mockImplementationOnce(() => {
        throw new Error('Error!');
      });
      await transactionController._isSmartContractTransaction(socket, example.consumer, web3, blockBody.transactions[0]);

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
        status: MESSAGE_STATUS.Mined,
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
      transactionController._cleantransactionSubscriptionList();

      transactionController.transactionEventEmitter.pending.event = {
        unsubscribe: jest.fn().mockImplementationOnce((callback) => callback(undefined, true)),
      };

      transactionController.transactionEventEmitter.mined.event = {
        unsubscribe: jest.fn().mockImplementationOnce((callback) => callback(undefined, true)),
      };

    });

    it('should unsubscribe for pending transfers', async () => {
      transactionController.transactionEventEmitter.pending.isSubscribed = true;
      transactionController.transactionSubscriptionList.push({
        socketId,
        address: 'address',
        status: MESSAGE_STATUS.Pending,
        eventKind: CONSUMER_EVENT_KINDS.Transfer,
      });

      expect(transactionController.transactionSubscriptionList.length).toBe(1);
      transactionController.unsubscribeTransactionsController(socketId, MESSAGE_STATUS.Pending, ['address'], CONSUMER_EVENT_KINDS.Transfer);
      expect(transactionController.transactionSubscriptionList.length).toBe(0);
      expect(transactionController.transactionEventEmitter.pending.isSubscribed).toBe(false);
      expect(transactionController.transactionEventEmitter.pending.event.unsubscribe).toHaveBeenCalledTimes(1);

    });

    it('should not unsubscribe for pending transfers', async () => {
      transactionController.transactionEventEmitter.pending.event.unsubscribe = jest.fn().mockImplementationOnce((callback) => callback('error', false));
      transactionController.transactionEventEmitter.pending.isSubscribed = true;
      transactionController.transactionSubscriptionList.push({
        socketId,
        address: 'address',
        status: MESSAGE_STATUS.Pending,
        eventKind: CONSUMER_EVENT_KINDS.Transfer,
      });

      expect(transactionController.transactionSubscriptionList.length).toBe(1);
      transactionController.unsubscribeTransactionsController(socketId, MESSAGE_STATUS.Pending, ['address'], CONSUMER_EVENT_KINDS.Transfer);
      expect(transactionController.transactionSubscriptionList.length).toBe(0);
      expect(transactionController.transactionEventEmitter.pending.isSubscribed).toBe(false);
      expect(transactionController.transactionEventEmitter.pending.event.unsubscribe).toHaveBeenCalledTimes(1);

    });

    it('should unsubscribe for mined transfers', async () => {
      transactionController.transactionEventEmitter.mined.isSubscribed = true;
      transactionController.transactionSubscriptionList.push({
        socketId,
        address: 'address',
        status: MESSAGE_STATUS.Mined,
        eventKind: CONSUMER_EVENT_KINDS.Transfer,
      });

      expect(transactionController.transactionSubscriptionList.length).toBe(1);
      transactionController.unsubscribeTransactionsController(socketId, MESSAGE_STATUS.Mined, ['address'], CONSUMER_EVENT_KINDS.Transfer);
      expect(transactionController.transactionSubscriptionList.length).toBe(0);
      expect(transactionController.transactionEventEmitter.mined.isSubscribed).toBe(false);
      expect(transactionController.transactionEventEmitter.mined.event.unsubscribe).toHaveBeenCalledTimes(1);

    });

    it('should not unsubscribe for mined transfers', async () => {
      transactionController.transactionEventEmitter.mined.event.unsubscribe = jest.fn().mockImplementationOnce((callback) => callback('error', false));
      transactionController.transactionEventEmitter.mined.isSubscribed = true;
      transactionController.transactionSubscriptionList.push({
        socketId,
        address: 'address',
        status: MESSAGE_STATUS.Mined,
        eventKind: CONSUMER_EVENT_KINDS.Transfer,
      });

      expect(transactionController.transactionSubscriptionList.length).toBe(1);
      transactionController.unsubscribeTransactionsController(socketId, MESSAGE_STATUS.Mined, ['address'], CONSUMER_EVENT_KINDS.Transfer);
      expect(transactionController.transactionSubscriptionList.length).toBe(0);
      expect(transactionController.transactionEventEmitter.mined.isSubscribed).toBe(false);
      expect(transactionController.transactionEventEmitter.mined.event.unsubscribe).toHaveBeenCalledTimes(1);

    });

    it('should unsubscribe for entry consumer', async () => {
      transactionController.transactionEventEmitter.mined.isSubscribed = true;
      transactionController.transactionEventEmitter.pending.isSubscribed = true;
      transactionController.transactionSubscriptionList.push(
        {
          socketId,
          address: 'address',
          status: MESSAGE_STATUS.Mined,
          eventKind: CONSUMER_EVENT_KINDS.Transfer,
        },
        {
          socketId: 'otherSocket',
          address: 'address',
          status: MESSAGE_STATUS.Mined,
          eventKind: CONSUMER_EVENT_KINDS.Transfer,
        },
        {
          socketId: 'otherSocket',
          address: 'address',
          status: MESSAGE_STATUS.Pending,
          eventKind: CONSUMER_EVENT_KINDS.Transfer,
        },
      );

      expect(transactionController.transactionSubscriptionList.length).toBe(3);
      transactionController.unsubscribeTransactionsController(socketId);
      expect(transactionController.transactionSubscriptionList.length).toBe(2);
      expect(transactionController.transactionEventEmitter.mined.event.unsubscribe).not.toHaveBeenCalled();
      expect(transactionController.transactionEventEmitter.mined.isSubscribed).toBe(true);
      expect(transactionController.transactionEventEmitter.pending.event.unsubscribe).not.toHaveBeenCalled();
      expect(transactionController.transactionEventEmitter.pending.isSubscribed).toBe(true);

    });

    it('should unsubscribe nothing', async () => {
      transactionController.transactionEventEmitter.mined.isSubscribed = false;
      transactionController.transactionEventEmitter.pending.isSubscribed = false;
      transactionController.transactionSubscriptionList.push({
        socketId,
        address: 'address',
        status: MESSAGE_STATUS.Mined,
        eventKind: CONSUMER_EVENT_KINDS.Transfer,
      });

      expect(transactionController.transactionSubscriptionList.length).toBe(1);
      transactionController.unsubscribeTransactionsController(socketId, MESSAGE_STATUS.Mined, ['address3'], CONSUMER_EVENT_KINDS.Transfer);
      expect(transactionController.transactionSubscriptionList.length).toBe(1);
      expect(transactionController.transactionEventEmitter.mined.event.unsubscribe).not.toHaveBeenCalled();
      expect(transactionController.transactionEventEmitter.pending.event.unsubscribe).not.toHaveBeenCalled();

    });

  });

  describe('_notifyConsumer', () => {
    let matchedAddress: string;
    let subscription: any;
    let _isSmartContractTransaction: any;

    beforeEach(() => {
      matchedAddress = 'address';

      jest.clearAllMocks();

      _isSmartContractTransaction = jest
        .spyOn((transactionController as any), '_isSmartContractTransaction').mockResolvedValue(false);

      subscription = {
        socket: 'socket',
        socketId,
        address: matchedAddress,
        status: MESSAGE_STATUS.Mined,
        consumer: {
          notify: jest.fn().mockImplementationOnce(() => true),
        },
      };

    });

    it('should call _notifyConsumer and it notify to consumer that there is a new smart contract transaction', async () => {
      _isSmartContractTransaction.mockResolvedValue(true);
      subscription.eventKind = CONSUMER_EVENT_KINDS.SmartContractTransaction;

      await transactionController._notifyConsumer(matchedAddress, blockBody.transactions[0], subscription, web3);

      expect(_isSmartContractTransaction).toHaveBeenCalledWith(subscription.socket, subscription.consumer, web3, blockBody.transactions[0]);
      expect(subscription.consumer.notify).toHaveBeenNthCalledWith(1, {
        kind: CONSUMER_EVENT_KINDS.SmartContractTransaction,
        body: blockBody.transactions[0],
        matchedAddress,
      });
      expect(subscription.consumer.notify).toHaveBeenNthCalledWith(2, {
        kind: 'tx',
        body: blockBody.transactions[0],
        matchedAddress,
      });

    });

    it('should call _notifyConsumer and it notify to consumer that there is a new transfer', async () => {
      subscription.eventKind = CONSUMER_EVENT_KINDS.Transfer;

      await transactionController._notifyConsumer(matchedAddress, blockBody.transactions[0], subscription, web3);

      expect(_isSmartContractTransaction).toHaveBeenCalledWith(subscription.socket, subscription.consumer, web3, blockBody.transactions[0]);
      expect(subscription.consumer.notify).toHaveBeenNthCalledWith(1, {
        kind: CONSUMER_EVENT_KINDS.Transfer,
        body: blockBody.transactions[0],
        matchedAddress,
      });
      expect(subscription.consumer.notify).toHaveBeenNthCalledWith(2, {
        kind: 'tx',
        body: blockBody.transactions[0],
        matchedAddress,
      });

    });

    it('should call _notifyConsumer and it notify to consumer that there is a new transaction', async () => {
      subscription.eventKind = CONSUMER_EVENT_KINDS.Transaction;

      await transactionController._notifyConsumer(matchedAddress, blockBody.transactions[0], subscription, web3);

      expect(_isSmartContractTransaction).toHaveBeenCalledWith(subscription.socket, subscription.consumer, web3, blockBody.transactions[0]);
      expect(subscription.consumer.notify).toHaveBeenNthCalledWith(1, {
        kind: CONSUMER_EVENT_KINDS.Transaction,
        body: blockBody.transactions[0],
        matchedAddress,
      });
      expect(subscription.consumer.notify).toHaveBeenNthCalledWith(2, {
        kind: 'tx',
        body: blockBody.transactions[0],
        matchedAddress,
      });

    });

    it('should call _notifyConsumer and it notify to consumer that there is a obsolete new transaction', async () => {
      subscription.eventKind = 'tx';

      await transactionController._notifyConsumer(matchedAddress, blockBody.transactions[0], subscription, web3);

      expect(_isSmartContractTransaction).toHaveBeenCalledWith(subscription.socket, subscription.consumer, web3, blockBody.transactions[0]);
      expect(subscription.consumer.notify).toHaveBeenNthCalledWith(1, {
        kind: 'tx',
        body: blockBody.transactions[0],
        matchedAddress,
      });

    });
  });

  describe('_restartSubscriptionsTransactions', () => {

    let _createTransactionEventEmitterMined: any;
    let _createTransactionEventEmitterPending: any;

    beforeEach(() => {

      jest.clearAllMocks();

      _createTransactionEventEmitterMined = jest
        .spyOn((transactionController as any), '_createTransactionEventEmitterMined')
        .mockImplementation(() => false);

      _createTransactionEventEmitterPending = jest
        .spyOn((transactionController as any), '_createTransactionEventEmitterPending')
        .mockImplementation(() => false);
    });

    it('should call _restartSubscriptionsTransactions correctly', async () => {

      transactionController.transactionEventEmitter.mined.isSubscribed = true;

      transactionController.transactionEventEmitter.pending.isSubscribed = true;

      await transactionController._restartSubscriptionsTransactions(web3);

      expect(_createTransactionEventEmitterMined).toHaveBeenCalledWith(web3);
      expect(_createTransactionEventEmitterPending).toHaveBeenCalledWith(web3);

    });

    it('should call _restartSubscriptionsTransactions correctly 2', async () => {

      transactionController.transactionEventEmitter.mined.isSubscribed = false;

      transactionController.transactionEventEmitter.pending.isSubscribed = false;

      await transactionController._restartSubscriptionsTransactions(web3);

      expect(_createTransactionEventEmitterMined).not.toHaveBeenCalled();
      expect(_createTransactionEventEmitterPending).not.toHaveBeenCalled();

    });

  });

});
