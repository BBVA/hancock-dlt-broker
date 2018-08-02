import 'jest';
import * as url from 'url';
import * as comsumer from '../../consumers/consumer';
import { getConsumer } from '../../consumers/consumerFactory';
import { findOne } from '../../domain/ethereum';
import {
  hancockGetBlockError,
  hancockGetCodeError,
  hancockSubscribeToTransferError,
} from '../../models/error';
import config from '../../utils/config';
import { error } from '../../utils/error';
import * as Ethereum from '../../utils/ethereum';
import * as ethereumController from '../ethereum';

jest.mock('url');
jest.mock('../../utils/config');
jest.mock('../../consumers/consumerFactory');
jest.mock('../../consumers/consumer');
jest.mock('../../utils/ethereum');
jest.mock('../../utils/logger');
jest.mock('../../utils/error');

describe('ethereumController', async () => {

  let socket: any;
  let req: any;
  let example: any;
  let spySubscribeTransferController: any;
  let spySubscribeContractsController: any;
  let spyOnErrorController: any;

  beforeEach(() => {

      socket = {
        on: jest.fn(),
        send: jest.fn(),
      };

      req = {};
      jest.clearAllMocks();

      example = {
        body: {},
        consumer: 'Consumer',
        kind: 'watch-contracts',
      };

      spySubscribeTransferController = jest.spyOn(ethereumController, '_subscribeTransferController')
      .mockImplementation(() => Promise.resolve(true));
      spySubscribeContractsController = jest.spyOn(ethereumController, '_subscribeContractsController')
      .mockImplementation(() => Promise.resolve(true));
      spyOnErrorController = jest.spyOn((ethereumController as any), '_onError')
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
    expect(socket.send).toHaveBeenCalledWith(JSON.stringify({kind: 'ready'}));
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
    expect(socket.send).toHaveBeenCalledWith(JSON.stringify({kind: 'ready'}));
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
    expect(socket.send).toHaveBeenCalledWith(JSON.stringify({kind: 'ready'}));
    expect(spySubscribeTransferController).toHaveBeenCalledTimes(0);
    expect(spySubscribeContractsController).toHaveBeenCalledTimes(1);
    expect(spyOnErrorController).toHaveBeenCalledTimes(0);
  });

  it('should call on message correctly and _subscribeTransferController', async () => {

    example.kind = 'watch-addresses';
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
    expect(spyOnErrorController).toHaveBeenCalledTimes(0);

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
    expect(spyOnErrorController).toHaveBeenCalledTimes(1);

  });

  it('should call on message correctly and onError with parseError', async () => {

    example.kind = 'watch-addresses';
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
    expect(spyOnErrorController).toHaveBeenCalledTimes(1);

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
  let newblock: any;
  let blockBody: any;
  let spyOnErrorController: any;
  let consumer: any;

  beforeEach(async () => {

    consumer = {
      notify: jest.fn().mockReturnValue(true),
    };

    (getConsumer as any) = jest.fn().mockImplementationOnce(() => {
      return consumer;
    });

    spyOnErrorController = jest.spyOn((ethereumController as any), '_onError')
    .mockImplementation(() => true);

    socket = {
      on: jest.fn(),
      send: jest.fn(),
      terminate: jest.fn(),
    };

    req = {};
    jest.clearAllMocks();

    example = {
      body: {},
      consumer: 'Consumer',
      kind: 'watch-contracts',
    };

    web3 = await Ethereum.getWeb3();
    newblock = {
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
  });

  describe('_subscribeTransferController', () => {

    it('should call _subscribeTransferController correctly', async () => {

      web3.eth.subscribe =  jest.fn().mockImplementation(() => {
        const promise = Promise.resolve('whatever');
        (promise as any).on = jest.fn().mockImplementationOnce(() => {
          const promise2 = Promise.resolve('whatever');
          (promise2 as any).on = jest.fn().mockImplementationOnce((message, callback) => {
            callback(newblock);
          });
          return promise2;
        });
        return promise;
      });

      web3.eth.getBlock =  jest.fn().mockReturnValueOnce(blockBody);

      web3.eth.getCode =  jest.fn().mockReturnValueOnce('0x0');

      await ethereumController._subscribeTransferController(socket, ['from'], web3, []);

      expect(web3.eth.getBlock).toHaveBeenCalledWith(newblock.hash, true);
      expect(web3.eth.getCode).toHaveBeenCalledWith('to');
      expect(consumer.notify).toHaveBeenCalledWith({ kind: 'tx', body: blockBody.transactions[0], matchedAddress: blockBody.transactions[0].from });

    });

    it('should call _subscribeTransferController and onError in getCode fail', async () => {

      web3.eth.subscribe =  jest.fn().mockImplementation(() => {
        const promise = Promise.resolve('whatever');
        (promise as any).on = jest.fn().mockImplementationOnce(() => {
          const promise2 = Promise.resolve('whatever');
          (promise2 as any).on = jest.fn().mockImplementationOnce((message, callback) => {
            callback(newblock);
          });
          return promise2;
        });
        return promise;
      });

      web3.eth.getBlock =  jest.fn().mockReturnValueOnce(blockBody);

      web3.eth.getCode =  jest.fn().mockImplementationOnce(() => {throw new Error('Error!'); });

      await ethereumController._subscribeTransferController(socket, ['from'], web3, []);

      expect(web3.eth.getBlock).toHaveBeenCalledWith(newblock.hash, true);
      expect(spyOnErrorController).toHaveBeenCalledWith(socket, error(hancockGetCodeError, new Error('Error!')), false, consumer);

    });

    it('should call _subscribeTransferController and onError in getBlock fail', async () => {

      web3.eth.subscribe =  jest.fn().mockImplementation(() => {
        const promise = Promise.resolve('whatever');
        (promise as any).on = jest.fn().mockImplementationOnce(() => {
          const promise2 = Promise.resolve('whatever');
          (promise2 as any).on = jest.fn().mockImplementationOnce((message, callback) => {
            callback(newblock);
          });
          return promise2;
        });
        return promise;
      });

      web3.eth.getBlock =  jest.fn().mockImplementationOnce(() => {throw new Error('Error!'); });

      await ethereumController._subscribeTransferController(socket, ['from'], web3, []);

      expect(web3.eth.getBlock).toHaveBeenCalledWith(newblock.hash, true);
      expect(spyOnErrorController).toHaveBeenCalledWith(socket, error(hancockGetBlockError, new Error('Error!')), false, consumer);

    });

    it('should call _subscribeTransferController and onError in web3 fail', async () => {

      web3.eth.subscribe =  jest.fn().mockImplementationOnce(() => {
        throw new Error('Error!');
      });
      await ethereumController._subscribeTransferController(socket, ['from'], web3, []);

      expect(spyOnErrorController).toHaveBeenCalledWith(socket, error(hancockSubscribeToTransferError, new Error('Error!')), false, consumer);

    });

    it('should call _subscribeTransferController correctly 2', async () => {

      web3.eth.subscribe =  jest.fn().mockImplementation(() => {
        const promise = Promise.resolve('whatever');
        (promise as any).on = jest.fn().mockImplementationOnce(() => {
          const promise2 = Promise.resolve('whatever');
          (promise2 as any).on = jest.fn().mockImplementationOnce((message, callback) => {
            callback(newblock);
          });
          return promise2;
        });
        return promise;
      });

      web3.eth.getBlock =  jest.fn().mockReturnValueOnce(blockBody);

      await ethereumController._subscribeTransferController(socket, ['to'], web3, []);

      expect(web3.eth.getBlock).toHaveBeenCalledWith(newblock.hash, true);
      expect(web3.eth.getCode).not.toHaveBeenCalled();
      expect(consumer.notify).toHaveBeenCalledWith({ kind: 'tx', body: blockBody.transactions[0], matchedAddress: blockBody.transactions[0].to });

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
          allEvents: jest.fn().mockImplementationOnce(() =>  {
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

    it('should call _subscribeContractsController correctly', async () => {

      web3.eth.subscribe =  jest.fn().mockImplementation(() => {
        const promise = Promise.resolve('whatever');
        (promise as any).on = jest.fn().mockImplementationOnce(() => {
          const promise2 = Promise.resolve('whatever');
          (promise2 as any).on = jest.fn().mockImplementationOnce((message, callback) => {
            callback(event);
          });
          return promise2;
        });
        return promise;
      });

      await ethereumController._subscribeContractsController(socket, ['from'], web3, []);

      expect(web3Contract.events.allEvents).toHaveBeenCalled();

      expect(consumer.notify).toHaveBeenCalledWith({ kind: 'event', body: contract, matchedAddress: 'mockedAddress' });
      expect(consumer.notify).toHaveBeenCalledWith({ kind: 'log', body: event, matchedAddress: contract.address });

    });

  });

});
