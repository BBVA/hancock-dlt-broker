import 'jest';
import {ISocketEvent} from '../../../models/models';
import {Consumer} from '../consumer';

jest.mock('../../../utils/logger');

describe('consumer', () => {

  let webSocket: any;
  let testConsumer: any;

  beforeEach(() => {

    webSocket = {
      send: jest.fn(),
    };

    testConsumer = new Consumer(webSocket as any);

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

});
