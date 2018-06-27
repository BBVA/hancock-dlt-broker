import 'jest';
import { IEthTransactionBody } from '../../models/ethereum';
import { ISocketEvent } from '../../models/models';
import { Consumer } from '../consumer';
import { CryptvaultConsumer, ICryptoVaultEventTxDirection } from '../cryptvaultConsumer';

jest.mock('../../utils/crypto');
jest.mock('request-promise-native');
jest.mock('../../utils/config');

describe('cryptvaultConsumer', () => {

  let webSocket: any;
  let testConsumer: any;
  let event: ISocketEvent;

  beforeEach(() => {

    webSocket = {
      send: jest.fn(),
    };

    event = {
      body: {
        from: '0x1',
        to: '0x0',
      },
      kind: 'tx',
      matchedAddress: '0x0',
    };

    testConsumer = new CryptvaultConsumer(webSocket as any);
    jest.restoreAllMocks();
  });

  it('should call cypherAndSendTransfer method on notify of tx', async () => {

    const spy = jest.spyOn(CryptvaultConsumer.prototype, 'notify').mockImplementation(() => Promise.resolve(true));
    await testConsumer.notify(event);
    expect(spy).toHaveBeenCalledWith(event);

  });

  it('should call cypherAndSendTransfer method on notify of not tx', async () => {

    event.kind = 'log';

    const spy = jest.spyOn(Consumer.prototype, 'notify').mockImplementation(() => Promise.resolve(true));
    await testConsumer.notify(event);
    expect(spy).toHaveBeenCalledWith(event);
  });

  it('should call cypherAndSendTransfer method successfully', async () => {

    const getTokenspy = jest.spyOn(CryptvaultConsumer.prototype, 'getToken')
    .mockImplementation(() => Promise.resolve('whatever'));
    const getTxDirectionspy = jest.spyOn(CryptvaultConsumer.prototype, 'getTxDirection')
    .mockImplementation(() => Promise.resolve('whatever'));
    await (testConsumer as any).cypherAndSendTransfer(event);
    expect(getTokenspy).toHaveBeenCalledTimes(1);
    expect(getTxDirectionspy).toHaveBeenCalledTimes(1);
  });

  it('should call getTxDirection method successfully and return 0', () => {

    const response = (testConsumer as any).getTxDirection(event);
    expect(response).toEqual(ICryptoVaultEventTxDirection.IN);
  });

  it('should call getTxDirection method successfully and return 1', () => {
    event.matchedAddress = '0x1';
    const response = (testConsumer as any).getTxDirection(event);
    expect(response).toEqual(ICryptoVaultEventTxDirection.OUT);
  });

});
