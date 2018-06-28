import 'jest';
import * as url from 'url';
import config from '../../utils/config';
import * as Ethereum from '../../utils/ethereum';
import * as ethereumController from '../ethereum';

jest.mock('url');
jest.mock('../../utils/config');

describe('ethereumController', async () => {

  let socket: any;
  let req: any;

  beforeEach(() => {

      socket = {
        on: jest.fn(),
        send: jest.fn(),
      };

      req = {};
      jest.clearAllMocks();
  });

  it('should call SocketSubscribeController correctly', async () => {

    (url as any).parse = jest.fn().mockReturnValueOnce({
      query: {
        address: undefined,
        consumer: 'tests',
        sender: undefined,
      },
    });

    const spySubscribeTransferController = jest.spyOn(ethereumController, '_subscribeTransferController')
    .mockImplementation(() => Promise.resolve(true));
    const spySubscribeContractsController = jest.spyOn(ethereumController, '_subscribeContractsController')
    .mockImplementation(() => Promise.resolve(true));

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

    const spySubscribeTransferController = jest.spyOn(ethereumController, '_subscribeTransferController')
    .mockImplementation(() => Promise.resolve(true));
    const spySubscribeContractsController = jest.spyOn(ethereumController, '_subscribeContractsController')
    .mockImplementation(() => Promise.resolve(true));

    await ethereumController.SocketSubscribeController(socket, req);

    expect(socket.on).toHaveBeenCalledTimes(2);
    expect(socket.send).toHaveBeenCalledTimes(1);
    expect(socket.send).toHaveBeenCalledWith(JSON.stringify({kind: 'ready'}));
    expect(spySubscribeTransferController).toHaveBeenCalledTimes(1);
    expect(spySubscribeContractsController).toHaveBeenCalledTimes(0);

    spySubscribeTransferController.mockRestore();
    spySubscribeContractsController.mockRestore();
  });

  it('should call SocketSubscribeController correctly and call SubscribeContractsController', async () => {

    (url as any).parse = jest.fn().mockReturnValueOnce({
      query: {
        address: 'tests',
        consumer: 'tests',
        sender: undefined,
      },
    });

    const spySubscribeTransferController = jest.spyOn(ethereumController, '_subscribeTransferController')
    .mockImplementation(() => Promise.resolve(true));
    const spySubscribeContractsController = jest.spyOn(ethereumController, '_subscribeContractsController')
    .mockImplementation(() => Promise.resolve(true));

    await ethereumController.SocketSubscribeController(socket, req);

    expect(socket.on).toHaveBeenCalledTimes(2);
    expect(socket.send).toHaveBeenCalledTimes(1);
    expect(socket.send).toHaveBeenCalledWith(JSON.stringify({kind: 'ready'}));
    expect(spySubscribeTransferController).toHaveBeenCalledTimes(0);
    expect(spySubscribeContractsController).toHaveBeenCalledTimes(1);

    spySubscribeTransferController.mockRestore();
    spySubscribeContractsController.mockRestore();
  });

  it('should call on message correctly ', async () => {

    const example = {
      body: {},
      consumer: 'Consumer',
      kind: 'watch-addresses',
    };

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

    const spySubscribeTransferController = jest.spyOn(ethereumController, '_subscribeTransferController')
    .mockImplementation(() => Promise.resolve(true));
    const spySubscribeContractsController = jest.spyOn(ethereumController, '_subscribeContractsController')
    .mockImplementation(() => Promise.resolve(true));

    await ethereumController.SocketSubscribeController(socket, req);

  });

});
