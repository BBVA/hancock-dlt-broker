import * as WebSocket from 'ws';
import logger from '../../utils/logger';
import { Consumer, IConsumer } from './consumer';
import { CryptvaultConsumer } from './cryptvaultConsumer';
import { CONSUMERS } from './types';

export function getConsumer(ws: WebSocket, consumer: CONSUMERS = CONSUMERS.Default): IConsumer {

  logger.info(`Consumer: ${JSON.stringify(consumer)}`);

  switch (consumer) {
    case CONSUMERS.Cryptvault:
      return new CryptvaultConsumer(ws);
    case CONSUMERS.Default:
    default:
      return new Consumer(ws);
  }

}
