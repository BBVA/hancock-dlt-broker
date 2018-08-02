import 'jest';
import { IEthTransactionBody } from '../../models/ethereum';
import { ISocketEvent } from '../../models/models';
import { Consumer } from '../consumer';

jest.mock('../../utils/logger');

describe('consumer', () => {

  let webSocket: any;
  let testConsumer: any;
  let tx: IEthTransactionBody;

  beforeEach(() => {

    webSocket = {
      send: jest.fn(),
    };

    testConsumer = new Consumer(webSocket as any);
    tx = {
      blockHash: '0x0',
      blockNumber: 1,
      from: '0x0123',
      gas: 10,
      gasPrice: '100000000000',
      hash: '0xab',
      input: '0x1',
      nonce: 1,
      to: '0x0124',
      transactionIndex: 1,
      value: '0',
    };

  });

  it('should call send method of websocket in notify', async () => {

    const event: ISocketEvent = {
      body: {},
      kind: 'tx',
    };

    await testConsumer.notify(event);
    expect((webSocket as any).send).toHaveBeenCalledWith(JSON.stringify(event));

  });

  it('should throw exception', async () => {

    try {
      await testConsumer.notify(null);
      fail('it should fail');
    } catch (error) {
      expect(error).toBeDefined();
    }

  });

  it('call getSenderFromRawTx should return sender successfully', async () => {

    const response = (testConsumer as any).getSenderFromRawTx(tx);
    expect(response).toBe(tx.from);

  });

  it('call getReceiverFromRawTx should return sender successfully', async () => {

    const response = (testConsumer as any).getReceiverFromRawTx(tx);
    expect(response).toBe(tx.to);

  });

});
