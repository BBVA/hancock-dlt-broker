import 'jest';
import * as url from 'url';
import {SOCKET_EVENT_KINDS} from '../../../models/models';
import {onError} from '../../../utils/error';
import * as contractController from '../contract';
import * as ethereumController from '../ethereum';
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

describe('ethereumController', async () => {

  let socket: any;
  let req: any;
  let example: any;
  let spySubscribeTransactionsController: any;
  let spySubscribeContractsController: any;
  let spyUnsubscribeTransactionsController: any;
  let spyUnsubscribeContractsController: any;

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

    spySubscribeTransactionsController = jest
      .spyOn(transactionController, 'subscribeTransactionsController')
      .mockImplementation(() => Promise.resolve(true));

    spySubscribeContractsController = jest
      .spyOn(contractController, 'subscribeContractsController')
      .mockImplementation(() => Promise.resolve(true));

    spyUnsubscribeTransactionsController = jest
      .spyOn(transactionController, 'unsubscribeTransactionsController')
      .mockImplementation(() => Promise.resolve(true));

    spyUnsubscribeContractsController = jest
      .spyOn(contractController, 'unsubscribeContractsController')
      .mockImplementation(() => Promise.resolve(true));

  });

  afterAll(() => {

    spySubscribeTransactionsController.mockRestore();
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
    expect(spySubscribeTransactionsController).toHaveBeenCalledTimes(0);
    expect(spySubscribeContractsController).toHaveBeenCalledTimes(0);

    spySubscribeTransactionsController.mockRestore();
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
    expect(spySubscribeTransactionsController).toHaveBeenCalledTimes(1);
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
    expect(spySubscribeTransactionsController).toHaveBeenCalledTimes(0);
    expect(spySubscribeContractsController).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledTimes(0);
  });

  it('should call on message correctly and _subscribeTransactionsController', async () => {

    example.kind = SOCKET_EVENT_KINDS.WatchTransfer;
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
    expect(spySubscribeTransactionsController).toHaveBeenCalledTimes(1);
    expect(spySubscribeContractsController).toHaveBeenCalledTimes(0);
    expect(onError).toHaveBeenCalledTimes(0);

  });

  it('should call on message correctly and _unsubscribeTransactionsController', async () => {

    example.kind = SOCKET_EVENT_KINDS.UnwatchTransfer;
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
    expect(spyUnsubscribeTransactionsController).toHaveBeenCalledTimes(2);
    expect(spyUnsubscribeContractsController).toHaveBeenCalledTimes(0);
    expect(onError).toHaveBeenCalledTimes(0);

  });

  it('should call on message correctly and _unsubscribeContractController', async () => {

    example.kind = SOCKET_EVENT_KINDS.ObsoleteUnwatchSmartContractEvent;
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
    expect(spyUnsubscribeTransactionsController).toHaveBeenCalledTimes(1);
    expect(spyUnsubscribeContractsController).toHaveBeenCalledTimes(1);
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
    expect(spySubscribeTransactionsController).toHaveBeenCalledTimes(0);
    expect(spySubscribeContractsController).toHaveBeenCalledTimes(0);
    expect(onError).toHaveBeenCalledTimes(1);

  });

  it('should call on message correctly and onError with parseError', async () => {

    example.kind = SOCKET_EVENT_KINDS.WatchTransfer;
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
    expect(spySubscribeTransactionsController).toHaveBeenCalledTimes(0);
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
    expect(spySubscribeTransactionsController).toHaveBeenCalledTimes(0);
    expect(spySubscribeContractsController).toHaveBeenCalledTimes(1);

  });

});
