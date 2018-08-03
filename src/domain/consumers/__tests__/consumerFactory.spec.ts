import 'jest';
import * as WebSocket from 'ws';
import * as consumer from '../consumer';
import * as cryptvaultConsumer from '../cryptvaultConsumer';
import * as types from '../types';

jest.mock('../consumer');
jest.mock('../cryptvaultConsumer');
jest.mock('../../../utils/logger');

import { getConsumer } from '../consumerFactory';

describe('consumerFactory', () => {

    it('::getConsumer should return the consumer successfully', () => {

        const webSocket = {} as any;
        const response = getConsumer(webSocket, types.CONSUMERS.Default);

        expect(consumer.Consumer).toHaveBeenCalledWith(webSocket);
        expect(response).toEqual((consumer as any).__consumerInstance__);

    });

    it('::getConsumer should return the consumer successfully without consumer', () => {

        const webSocket = {} as any;
        const response = getConsumer(webSocket);

        expect(consumer.Consumer).toHaveBeenCalledWith(webSocket);
        expect(response).toEqual((consumer as any).__consumerInstance__);

    });

    it('::getConsumer should return the cryptvaultConsumer successfully', () => {

        const webSocket = {} as any;
        const response = getConsumer(webSocket, types.CONSUMERS.Cryptvault);

        expect(cryptvaultConsumer.CryptvaultConsumer).toHaveBeenCalledWith(webSocket);
        expect(response).toEqual((cryptvaultConsumer as any).__consumerCryptVaultInstance__);

    });

});
