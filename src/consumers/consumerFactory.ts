import * as WebSocket from 'ws';
import { Consumer, IConsumer } from './consumer';
import { CryptvaultConsumer } from './cryptvaultConsumer';
import { CONSUMERS } from './types';

const consumerSingletons: {[k: string]: IConsumer} = {};

export function getConsumer(ws: WebSocket, consumer: CONSUMERS = CONSUMERS.Default): IConsumer {

  console.log(`Consumer: ${JSON.stringify(consumer)}`);

  // it cant be singleton because is handling the socket client inside
  // if (consumerSingletons[consumer]) {
  //   return consumerSingletons[consumer];
  // }

  switch (consumer) {
    case CONSUMERS.Cryptvault:
      return new CryptvaultConsumer(ws);
      // consumerSingletons[consumer] = new CryptvaultConsumer(ws);
      // break;
    case CONSUMERS.Default:
    default:
      return new Consumer(ws);
      // consumerSingletons[consumer] = new Consumer(ws);
      // break;
  }

}
