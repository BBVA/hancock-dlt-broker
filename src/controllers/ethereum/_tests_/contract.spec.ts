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
import * as contractController from '../contract';
import * as ethereumController from '../ethereum';
import * as transactionController from '../transaction';

jest.mock('url');
jest.mock('fs');
jest.mock('path');
jest.mock('../../utils/config');
jest.mock('../../domain/consumers/consumerFactory');
jest.mock('../../domain/consumers/consumer');
jest.mock('../../utils/ethereum');
jest.mock('../../utils/logger');
jest.mock('../../utils/error');
jest.mock('../../utils/schema');

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

    let reactToNewTransfer: any;
    const status = 'mined';

    beforeEach(() => {

      jest.clearAllMocks();

      reactToNewTransfer = jest
        .spyOn((ethereumController as any), '_reactToNewBlock')
        .mockImplementation(() => Promise.resolve(true));

    });

    afterAll(() => {

      reactToNewTransfer.mockRestore();

    });

    it('should call _subscribeTransactionsController correctly', async () => {

      await ethereumController._subscribeTransactionsController(socket, status, ['from'], web3, []);

      expect(reactToNewTransfer).toHaveBeenCalledWith(socket, 'from', web3, newBlock, __consumerInstance__, false);

    });

    it('should call _subscribeTransactionsController and onError in web3 fail', async () => {

      web3.eth.subscribe = jest.fn().mockImplementationOnce(() => {
        throw new Error('Error!');
      });
      await ethereumController._subscribeTransactionsController(socket, status, ['from'], web3, []);

      expect(onError).toHaveBeenCalledWith(socket, error(hancockSubscribeToTransferError, new Error('Error!')), false, __consumerInstance__);

    });

  });

  describe('_reactToNewBlock', () => {

    it('should call _reactToNewBlock correctly', async () => {

      web3.eth.getBlock = jest.fn().mockResolvedValueOnce(blockBody);

      web3.eth.getCode = jest.fn().mockResolvedValueOnce('0x0');

      await ethereumController._reactToNewBlock(socket, 'from', web3, newBlock, __consumerInstance__, false);

      expect(web3.eth.getBlock).toHaveBeenCalledWith(newBlock.hash, true);
      expect(web3.eth.getCode).toHaveBeenCalledWith('to');
      expect(__consumerInstance__.notify).toHaveBeenCalledWith({ kind: 'tx', body: blockBody.transactions[0], matchedAddress: blockBody.transactions[0].from });

    });

    it('should call _reactToNewBlock and onError in getCode fail', async () => {

      web3.eth.getBlock = jest.fn().mockResolvedValueOnce(blockBody);

      web3.eth.getCode = jest.fn().mockRejectedValueOnce(new Error('Error!'));

      await ethereumController._reactToNewBlock(socket, 'from', web3, newBlock, __consumerInstance__, true);

      expect(web3.eth.getBlock).toHaveBeenCalledWith(newBlock.hash, true);
      expect(onError).toHaveBeenCalledWith(socket, error(hancockGetCodeError, new Error('Error!')), false, __consumerInstance__);

    });

    it('should call _reactToNewBlock and onError in getBlock fail', async () => {

      web3.eth.getBlock = jest.fn().mockImplementationOnce(() => { throw new Error('Error!'); });

      await ethereumController._reactToNewBlock(socket, 'from', web3, newBlock, __consumerInstance__, true);

      expect(web3.eth.getBlock).toHaveBeenCalledWith(newBlock.hash, true);
      expect(onError).toHaveBeenCalledWith(socket, error(hancockGetBlockError, new Error('Error!')), false, __consumerInstance__);

    });

    it('should call _reactToNewBlock correctly 2', async () => {

      web3.eth.getBlock = jest.fn().mockReturnValueOnce(blockBody);

      await ethereumController._reactToNewBlock(socket, 'to', web3, newBlock, __consumerInstance__, true);

      expect(web3.eth.getBlock).toHaveBeenCalledWith(newBlock.hash, true);
      expect(web3.eth.getCode).not.toHaveBeenCalled();
      expect(__consumerInstance__.notify).toHaveBeenCalledWith({ kind: 'tx', body: blockBody.transactions[0], matchedAddress: blockBody.transactions[0].to });

    });

  });

  describe('_subscribeContractsController', () => {

    const event = {
      id: 1,
      event: 'whatever',
    };

    const contract = {
      address: 'mockedAddress',
      alias: 'mockedAlias',
      abi: [],
    };

    let web3Contract: any;

    (findOne as any) = jest.fn().mockResolvedValueOnce(Promise.resolve(contract));

    beforeEach(() => {

      web3Contract = {
        events: {
          allEvents: jest.fn().mockImplementationOnce((obj) => {
            return {
              on: jest.fn().mockImplementationOnce(() => {
                return {
                  on: jest.fn().mockImplementationOnce((message, callback) => {
                    callback(event);
                  }),
                };
              }),
            };
          }),
        },
      };

      web3.eth.Contract.mockImplementation(() => web3Contract);

    });

    it('should call _subscribeContractsController and call onError', async () => {

      (findOne as any) = jest.fn().mockImplementationOnce(() => {
        throw new Error('Error!');
      });

      await ethereumController._subscribeContractsController(socket, ['from'], web3, []);

      expect(onError).toHaveBeenCalled();

    });

  });

});
