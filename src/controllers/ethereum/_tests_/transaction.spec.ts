import 'jest';
import * as url from 'url';
import { __consumerInstance__ } from '../../../domain/consumers/__mocks__/consumer';
import { findOne } from '../../../domain/ethereum';
import {
  hancockGetBlockError,
  hancockGetCodeError,
  hancockSubscribeToTransferError,
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

describe('subscribers', () => {

  let socket: any;
  let req: any;
  let example: any;
  let web3: any;
  let newBlock: any;
  let blockBody: any;

  beforeEach(async () => {
    jest.clearAllMocks();

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
      hash: '0xf22152edb76673b5f6909e5693f786128760a3761c8a3ccd6b63a3ca45bd053c',
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

    });

    it('should call _subscribeTransactionsController correctly and call createTransactionEventEmitterMined', async () => {

      await transactionController._subscribeTransactionsController(socket, uuid, status, ['from'], web3);

      expect(createTransactionEventEmitterMined).toHaveBeenCalledWith( web3);
      expect(createTransactionEventEmitterPending).not.toHaveBeenCalled();

    });

    it('should call _subscribeTransactionsController correctly and call createTransactionEventEmitterPending', async () => {

      await transactionController._subscribeTransactionsController(socket, uuid, 'pending', ['from'], web3);

      expect(createTransactionEventEmitterPending).toHaveBeenCalledWith( web3);
      expect(createTransactionEventEmitterMined).not.toHaveBeenCalled();

    });

    it('should call _subscribeTransactionsController and onError in web3 fail', async () => {

      createTransactionEventEmitterMined = jest
        .spyOn((transactionController as any), '_createTransactionEventEmitterMined')
        .mockImplementationOnce(() => { throw new Error('Error!'); });

      await transactionController._subscribeTransactionsController(socket, uuid, status, ['from'], web3);

      expect(onError).toHaveBeenCalledWith(socket, error(hancockSubscribeToTransferError, new Error('Error!')), false, __consumerInstance__);

    });

  });

  describe('_reactToNewBlock', () => {

    let processOnError: any;
    let _reactToTx: any;
    beforeEach(() => {

      jest.clearAllMocks();

      processOnError = jest
        .spyOn((transactionController as any), 'processOnError')
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

});
