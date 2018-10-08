import 'jest';
import * as url from 'url';
import { __consumerInstance__ } from '../../domain/consumers/__mocks__/consumer';
import { findOne } from '../../domain/ethereum';
import {
  hancockGetBlockError,
  hancockGetCodeError,
  hancockSubscribeToTransferError,
} from '../../models/error';
import {error, onError} from '../../utils/error';
import * as Ethereum from '../../utils/ethereum';
import * as ethereumController from '../ethereum';

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

describe('ethereumController', async () => {

  let socket: any;
  let req: any;
  let example: any;
  let spySubscribeTransferController: any;
  let spySubscribeContractsController: any;

  beforeEach(() => {

    socket = {
      on: jest.fn(),
      send: jest.fn(),
    };

    req = {};
    jest.clearAllMocks();

    example = {
      consumer: 'Consumer',
      kind: 'watch-contracts',
    };

    spySubscribeTransferController = jest
      .spyOn(ethereumController, '_subscribeTransactionsController')
      .mockImplementation(() => Promise.resolve(true));

    spySubscribeContractsController = jest
      .spyOn(ethereumController, '_subscribeContractsController')
      .mockImplementation(() => Promise.resolve(true));

  });

  afterAll(() => {

    spySubscribeTransferController.mockRestore();
    spySubscribeContractsController.mockRestore();

  });

  it('should call SocketSubscribeController correctly', async () => {

    (url as any).parse = jest.fn().mockReturnValueOnce({
      query: {
        address: undefined,
        consumer: 'tests',
        sender: undefined,
      },
    });

    await ethereumController.SocketSubscribeController(socket, req);

    expect(socket.on).toHaveBeenCalledTimes(2);
    expect(socket.send).toHaveBeenCalledTimes(1);
    expect(socket.send).toHaveBeenCalledWith(JSON.stringify({ kind: 'ready' }));
    expect(spySubscribeTransferController).toHaveBeenCalledTimes(0);
    expect(spySubscribeContractsController).toHaveBeenCalledTimes(0);

    spySubscribeTransferController.mockRestore();
    spySubscribeContractsController.mockRestore();
  });

  it('should call SocketSubscribeController correctly and call SubscribeTransferController', async () => {

    (url as any).parse = jest.fn().mockReturnValueOnce({
      query: {
        address: undefined,
        consumer: 'tests',
        sender: 'tests',
      },
    });

    await ethereumController.SocketSubscribeController(socket, req);

    expect(socket.on).toHaveBeenCalledTimes(2);
    expect(socket.send).toHaveBeenCalledTimes(1);
    expect(socket.send).toHaveBeenCalledWith(JSON.stringify({ kind: 'ready' }));
    expect(spySubscribeTransferController).toHaveBeenCalledTimes(1);
    expect(spySubscribeContractsController).toHaveBeenCalledTimes(0);
  });

  it('should call SocketSubscribeController correctly and call SubscribeContractsController', async () => {

    (url as any).parse = jest.fn().mockReturnValueOnce({
      query: {
        address: 'tests',
        consumer: 'tests',
        sender: undefined,
      },
    });

    await ethereumController.SocketSubscribeController(socket, req);

    expect(socket.on).toHaveBeenCalledTimes(2);
    expect(socket.send).toHaveBeenCalledTimes(1);
    expect(socket.send).toHaveBeenCalledWith(JSON.stringify({ kind: 'ready' }));
    expect(spySubscribeTransferController).toHaveBeenCalledTimes(0);
    expect(spySubscribeContractsController).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledTimes(0);
  });

  it('should call on message correctly and _subscribeTransactionsController', async () => {

    example.kind = 'watch-transfers';
    socket.on = jest.fn().mockImplementationOnce((kind, callbacks) => {
      callbacks();
    }).mockImplementationOnce((kind, callbacks) => {
      callbacks(JSON.stringify(example));
    });

    (url as any).parse = jest.fn().mockReturnValueOnce({
      query: {
        address: undefined,
        consumer: 'tests',
        sender: undefined,
      },
    });

    await ethereumController.SocketSubscribeController(socket, req);

    expect(socket.on).toHaveBeenCalledTimes(2);
    expect(spySubscribeTransferController).toHaveBeenCalledTimes(1);
    expect(spySubscribeContractsController).toHaveBeenCalledTimes(0);
    expect(onError).toHaveBeenCalledTimes(0);

  });

  it('should call on message correctly and onError with unknown kind', async () => {

    example.kind = 'other';
    socket.on = jest.fn().mockImplementationOnce((kind, callbacks) => {
      callbacks();
    }).mockImplementationOnce((kind, callbacks) => {
      callbacks(JSON.stringify(example));
    });

    (url as any).parse = jest.fn().mockReturnValueOnce({
      query: {
        address: undefined,
        consumer: 'tests',
        sender: undefined,
      },
    });

    await ethereumController.SocketSubscribeController(socket, req);

    expect(socket.on).toHaveBeenCalledTimes(2);
    expect(spySubscribeTransferController).toHaveBeenCalledTimes(0);
    expect(spySubscribeContractsController).toHaveBeenCalledTimes(0);
    expect(onError).toHaveBeenCalledTimes(1);

  });

  it('should call on message correctly and onError with parseError', async () => {

    example.kind = 'watch-transfers';
    socket.on = jest.fn().mockImplementationOnce((kind, callbacks) => {
      callbacks();
    }).mockImplementationOnce((kind, callbacks) => {
      callbacks(example);
    });

    (url as any).parse = jest.fn().mockReturnValueOnce({
      query: {
        address: undefined,
        consumer: 'tests',
        sender: undefined,
      },
    });

    await ethereumController.SocketSubscribeController(socket, req);

    expect(socket.on).toHaveBeenCalledTimes(2);
    expect(spySubscribeTransferController).toHaveBeenCalledTimes(0);
    expect(spySubscribeContractsController).toHaveBeenCalledTimes(0);
    expect(onError).toHaveBeenCalledTimes(1);

  });

  it('should call on message correctly and _subscribeContractsController', async () => {

    socket.on = jest.fn().mockImplementationOnce((kind, callbacks) => {
      callbacks();
    }).mockImplementationOnce((kind, callbacks) => {
      callbacks(JSON.stringify(example));
    });

    (url as any).parse = jest.fn().mockReturnValueOnce({
      query: {
        address: undefined,
        consumer: 'tests',
        sender: undefined,
      },
    });

    await ethereumController.SocketSubscribeController(socket, req);

    expect(socket.on).toHaveBeenCalledTimes(2);
    expect(spySubscribeTransferController).toHaveBeenCalledTimes(0);
    expect(spySubscribeContractsController).toHaveBeenCalledTimes(1);

  });

});

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

    beforeEach(() => {

      jest.clearAllMocks();

      reactToNewTransfer = jest
        .spyOn((ethereumController as any), '_reactToNewTransaction')
        .mockImplementation(() => Promise.resolve(true));

    });

    afterAll(() => {

      reactToNewTransfer.mockRestore();

    });

    it('should call _subscribeTransactionsController correctly', async () => {

      await ethereumController._subscribeTransactionsController(socket, ['from'], web3, []);

      expect(reactToNewTransfer).toHaveBeenCalledWith(socket, 'from', web3, newBlock, __consumerInstance__, false);

    });

    it('should call _subscribeTransactionsController and onError in web3 fail', async () => {

      web3.eth.subscribe = jest.fn().mockImplementationOnce(() => {
        throw new Error('Error!');
      });
      await ethereumController._subscribeTransactionsController(socket, ['from'], web3, []);

      expect(onError).toHaveBeenCalledWith(socket, error(hancockSubscribeToTransferError, new Error('Error!')), false, __consumerInstance__);

    });

  });

  describe('_reactToNewTransaction', () => {

    it('should call _reactToNewTransaction correctly', async () => {

      web3.eth.getBlock = jest.fn().mockResolvedValueOnce(blockBody);

      web3.eth.getCode = jest.fn().mockResolvedValueOnce('0x0');

      await ethereumController._reactToNewTransaction(socket, 'from', web3, newBlock, __consumerInstance__, false);

      expect(web3.eth.getBlock).toHaveBeenCalledWith(newBlock.hash, true);
      expect(web3.eth.getCode).toHaveBeenCalledWith('to');
      expect(__consumerInstance__.notify).toHaveBeenCalledWith({ kind: 'tx', body: blockBody.transactions[0], matchedAddress: blockBody.transactions[0].from });

    });

    it('should call _reactToNewTransaction and onError in getCode fail', async () => {

      web3.eth.getBlock = jest.fn().mockResolvedValueOnce(blockBody);

      web3.eth.getCode = jest.fn().mockRejectedValueOnce(new Error('Error!'));

      await ethereumController._reactToNewTransaction(socket, 'from', web3, newBlock, __consumerInstance__, true);

      expect(web3.eth.getBlock).toHaveBeenCalledWith(newBlock.hash, true);
      expect(onError).toHaveBeenCalledWith(socket, error(hancockGetCodeError, new Error('Error!')), false, __consumerInstance__);

    });

    it('should call _reactToNewTransaction and onError in getBlock fail', async () => {

      web3.eth.getBlock = jest.fn().mockImplementationOnce(() => { throw new Error('Error!'); });

      await ethereumController._reactToNewTransaction(socket, 'from', web3, newBlock, __consumerInstance__, true);

      expect(web3.eth.getBlock).toHaveBeenCalledWith(newBlock.hash, true);
      expect(onError).toHaveBeenCalledWith(socket, error(hancockGetBlockError, new Error('Error!')), false, __consumerInstance__);

    });

    it('should call _reactToNewTransaction correctly 2', async () => {

      web3.eth.getBlock = jest.fn().mockReturnValueOnce(blockBody);

      await ethereumController._reactToNewTransaction(socket, 'to', web3, newBlock, __consumerInstance__, true);

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
