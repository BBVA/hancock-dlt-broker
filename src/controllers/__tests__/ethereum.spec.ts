import 'jest';
import * as url from 'url';
import * as comsumer from '../../consumers/consumer';
import { getConsumer } from '../../consumers/consumerFactory';
import config from '../../utils/config';
import * as Ethereum from '../../utils/ethereum';
import * as ethereumController from '../ethereum';

jest.mock('url');
jest.mock('../../utils/config');
jest.mock('../../consumers/consumerFactory');
jest.mock('../../consumers/consumer');
jest.mock('../../utils/ethereum');

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
        body: {},
        consumer: 'Consumer',
        kind: 'watch-contracts',
      };

      spySubscribeTransferController = jest.spyOn(ethereumController, '_subscribeTransferController')
      .mockImplementation(() => Promise.resolve(true));
      spySubscribeContractsController = jest.spyOn(ethereumController, '_subscribeContractsController')
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

describe('_subscribeContractsController', () => {

  let socket: any;
  let req: any;
  let example: any;
  let web3: any;
  let newblock: any;
  let blockBody: any;

  beforeEach(async () => {

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

  it('should call _subscribeContractsController correctly', async () => {

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

    web3.eth.getBlock =  jest.fn().mockImplementation(() => {
      const promise = Promise.resolve(blockBody);
      return promise;
    });

    web3.eth.getCode =  jest.fn().mockImplementation(() => {
      const promise = Promise.resolve('0x0');
      return promise;
    });

    await ethereumController._subscribeTransferController(socket, ['from'], web3, []);

    expect(web3.eth.getBlock).toHaveBeenCalledWith(newblock.hash, true);
    expect(web3.eth.getCode).toHaveBeenCalledWith('to');

  });

  it('should call _subscribeContractsController correctly 2', async () => {

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

    web3.eth.getBlock =  jest.fn().mockImplementation(() => {
      const promise = Promise.resolve(blockBody);
      return promise;
    });

    await ethereumController._subscribeTransferController(socket, ['to'], web3, []);

    expect(web3.eth.getBlock).toHaveBeenCalledWith(newblock.hash, true);

  });

});
