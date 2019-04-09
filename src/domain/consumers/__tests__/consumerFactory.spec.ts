import 'jest';
import * as consumer from '../consumer';
import {getConsumer} from '../consumerFactory';

jest.mock('../consumer');
jest.mock('../secureConsumer');
jest.mock('../../../utils/logger');
jest.mock('../../../utils/config');
jest.mock('../../../utils/db');

describe('consumerFactory', () => {

  it('::getConsumer should return the consumer successfully', async () => {

    const webSocket = {} as any;
    const response = await getConsumer(webSocket, 'default provider');

    expect(response).toEqual((consumer as any).__consumerInstance__);

  });

  it('::getConsumer should return the secureConsumer successfully', async () => {

    const webSocket = {} as any;
    const response = await getConsumer(webSocket, '');

    expect(response).toEqual((consumer as any).__consumerInstance__);

  });

});
