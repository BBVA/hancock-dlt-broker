import 'jest';
import { IEthTransactionBody } from '../../models/ethereum';
import { ISocketEvent } from '../../models/models';
import * as cryptoUtils from '../../utils/crypto';
import { Consumer } from '../consumer';
import { CryptvaultConsumer } from '../cryptvaultConsumer';

jest.mock('../../utils/crypto');
jest.mock('request-promise-native');
jest.mock('../../utils/config');

describe('cryptvaultConsumer', () => {

  let webSocket: any;
  let testConsumer: any;

  beforeEach(() => {

    webSocket = {
      send: jest.fn(),
    };

    testConsumer = new CryptvaultConsumer(webSocket as any);
    jest.restoreAllMocks();
  });

  it('should call cypherAndSendTransfer method on notify of tx', async () => {

    const event: ISocketEvent = {
      body: {},
      kind: 'tx',
    };

    const spy = jest.spyOn(CryptvaultConsumer.prototype, 'notify').mockImplementation(() => Promise.resolve(true));
    await testConsumer.notify(event);
    expect(spy).toHaveBeenCalledWith(event);

  });

  it('should call cypherAndSendTransfer method on notify of not tx', async () => {

    const event: ISocketEvent = {
      body: {},
      kind: 'log',
    };

    const spy = jest.spyOn(Consumer.prototype, 'notify').mockImplementation(() => Promise.resolve(true));
    await testConsumer.notify(event);
    expect(spy).toHaveBeenCalledWith(event);
  });

  it('should call cypherAndSendTransfer method successfully', async () => {

    const event: ISocketEvent = {
      body: {},
      kind: 'tx',
    };

    (CryptvaultConsumer.prototype as any).getToken = jest.fn();
    console.log((testConsumer as any).cypherAndSendTransfer);
    await (testConsumer as any).cypherAndSendTransfer(event);
    expect((CryptvaultConsumer.prototype as any).getToken).toHaveBeenCalledWith(event);

  });

});
