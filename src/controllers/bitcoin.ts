import * as fs from 'fs';
import * as http from 'http';
import * as path from 'path';
import * as url from 'url';
import * as WebSocket from 'ws';
import {IConsumer} from '../domain/consumers/consumer';
import {getConsumer} from '../domain/consumers/consumerFactory';
import {CONSUMERS} from '../domain/consumers/types';
import {
  IBitcoinBlockBody,
  IBitcoinBlockHeader,
  IBitcoinTransaction,
  IBitcoinTransactionVin,
  IBitcoinTransactionVout,
} from '../models/bitcoin';
import {
  hancockGetBlockError,
  hancockMessageKindUnknownError,
  hancockNewBlockHeadersError, hancockParseError,
  hancockSubscribeToTransferError,
} from '../models/error';
import {ISocketMessage} from '../models/models';
import {BitcoinClient, getBitcoinClient} from '../utils/bitcoin';
import {error, onError} from '../utils/error';
import logger from '../utils/logger';
import {validateSchema} from '../utils/schema';

const schemaPath: string = path.normalize(__dirname + '/../../../raml/schemas');
const receiveMessageSchema = JSON.parse(fs.readFileSync(`${schemaPath}/requests/receiveMessage.json`, 'utf-8'));

// tslint:disable-next-line:variable-name
export async function SocketSubscribeController(socket: WebSocket, req: http.IncomingMessage) {

  try {

    const {query} = url.parse(req.url as string, true);

    const sender: string = query.sender as string;
    const consumer: CONSUMERS = query.consumer as CONSUMERS;

    logger.info('Incoming socket connection => ', consumer, sender);

    const subscriptions: any[] = [];

    socket.on('close', () => {

      logger.info('unsubscribing...');

      subscriptions.forEach((sub) => {
        sub.unsubscribe();
      });

    });

    socket.on('message', (data: any) => {

      let dataObj: ISocketMessage;
      const consumerInstance: IConsumer = getConsumer(socket, consumer);

      try {

        dataObj = JSON.parse(data);

      } catch (err) {

        onError(socket, error(hancockParseError, err), false, consumerInstance);
        return;

      }

      logger.info('Incoming message => ', dataObj);

      switch (dataObj.kind) {
        case 'watch-transfers':
        case 'watch-transactions':
          if (validateSchema(dataObj, receiveMessageSchema, socket, consumerInstance)) {
            _subscribeTransactions(socket, dataObj.body, subscriptions, dataObj.consumer);
          }
          break;
        default:
          onError(socket, hancockMessageKindUnknownError, false, consumerInstance);
      }

    });

    if (sender) {
      _subscribeTransactions(socket, [sender], subscriptions, consumer, true);
    }

    socket.send(JSON.stringify({kind: 'ready'}));

  } catch (e) {

    logger.error(e);

  }

}

// tslint:disable-next-line:variable-name
export const _subscribeTransactions = async (socket: WebSocket,
                                             addresses: string[],
                                             subscriptions: any[],
                                             consumer: CONSUMERS = CONSUMERS.Default,
                                             onlyTransfers: boolean = false) => {

  const consumerInstance: IConsumer = getConsumer(socket, consumer);
  const bitcoinClient: BitcoinClient = await getBitcoinClient();

  try {

    addresses.forEach((address: string) => {
      // Subscribe to pending transactions
      logger.info('Subscribing to mined transactions...');

      subscriptions.push(
        bitcoinClient.socket
          .subscribeToNewBLocks()
          .on('error', (err: Error) => onError(socket, error(hancockNewBlockHeadersError, err), false, consumerInstance))
          .on('data', (blockMined: IBitcoinBlockHeader) => _reactToNewTransaction(socket, address, blockMined, consumerInstance, onlyTransfers)),
      );
    });

  } catch (err) {

    onError(socket, error(hancockSubscribeToTransferError, err), false, consumerInstance);

  }

};

export const _reactToNewTransaction = async (socket: WebSocket,
                                             address: string,
                                             blockMined: IBitcoinBlockHeader,
                                             consumerInstance: IConsumer,
                                             onlyTransfers: boolean) => {

  try {

    const bitcoinClient: BitcoinClient = await getBitcoinClient();

    logger.debug('newBlock mined', blockMined.hash);

    const blockBody: IBitcoinBlockBody = await bitcoinClient.api.getBlock(blockMined.hash);

    return await Promise.all(blockBody.txs.map(async (txBody: IBitcoinTransaction) => {

      if (!txBody.isCoinBase) {
        txBody.vin.map(async (vin: IBitcoinTransactionVin) => {
          if (vin.addr === address && !onlyTransfers) {
            logger.info(`new tx =>> ${txBody.txid}, from: ${vin.addr}`);
            consumerInstance.notify({kind: 'tx', body: txBody, matchedAddress: vin.addr});
          }
        });

        txBody.vout.map(async (vout: IBitcoinTransactionVout) => {
          if (vout.scriptPubKey.addresses.length && vout.scriptPubKey.addresses[0] === address) {
            logger.info(`new tx =>> ${txBody.txid}, to: ${vout.scriptPubKey.addresses[0]}`);
            consumerInstance.notify({kind: 'tx', body: txBody, matchedAddress: vout.scriptPubKey.addresses[0]});
          }
        });
      }

    }));

  } catch (err) {

    onError(socket, error(hancockGetBlockError, err), false, consumerInstance);

  }
};
