import * as WebSocket from 'ws';
import * as db from '../../db/ethereum';
import {IEthereumProviderModel} from '../../models/ethereum';
import {PROTOCOLS} from '../../types';
import logger from '../../utils/logger';
import {Consumer, IConsumer} from './consumer';
import {SecureConsumer} from './secureConsumer';

export async function getConsumer(ws: WebSocket, consumer: string): Promise<IConsumer> {

  // @ts-ignore
  const providerData: IEthereumProviderModel = await db.getProviderByAlias(consumer);

  if (providerData && providerData.protocol === PROTOCOLS.SECURE) {

    logger.debug(`Secure provider: ${consumer}`);
    return new SecureConsumer(ws, providerData);

  }

  logger.debug(`Default provider: ${consumer}`);
  return new Consumer(ws);

}
