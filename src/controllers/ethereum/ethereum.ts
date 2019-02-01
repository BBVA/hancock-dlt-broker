import * as fs from 'fs';
import * as http from 'http';
import * as path from 'path';
import * as url from 'url';
import * as WebSocket from 'ws';
import { IConsumer } from '../../domain/consumers/consumer';
import { getConsumer } from '../../domain/consumers/consumerFactory';
import { CONSUMERS } from '../../domain/consumers/types';
import {
  hancockMessageKindUnknownError,
  hancockParseError,
} from '../../models/error';
import { ISocketMessage, ISocketMessageStatus } from '../../models/models';
import { error, onError } from '../../utils/error';
import * as Ethereum from '../../utils/ethereum';
import logger from '../../utils/logger';
import { validateSchema } from '../../utils/schema';
import { _subscribeContractsController } from './contract';
import { _removeAddressFromSocket, _subscribeTransactionsController } from './transaction';

const schemaPath: string = path.normalize(__dirname + '/../../../../raml/schemas');
const receiveMessageSchema = JSON.parse(fs.readFileSync(`${schemaPath}/requests/receiveMessage.json`, 'utf-8'));

// let transactionSubscriptionList: any[];

// tslint:disable-next-line:variable-name
export async function SocketSubscribeController(socket: WebSocket, req: http.IncomingMessage) {

  try {

    const { query } = url.parse(req.url as string, true);

    const addressOrAlias: string = (query.address || query.alias) as string;
    const sender: string = query.sender as string;
    const status: ISocketMessageStatus = query.status === 'pending' ? query.status : 'mined';
    const consumer: CONSUMERS = query.consumer as CONSUMERS;

    logger.info('Incoming socket connection => ', consumer, addressOrAlias || sender);

    const subscriptionsContracts: any[] = [];
    const subscriptionsContractsAddress: any[] = [];
    // tslint:disable-next-line:prefer-const
    let pendingTransactionEventEmitter: any;
    // tslint:disable-next-line:prefer-const
    let pendingTransferEventEmitter: any;
    const uuid: string = 'id';
    const web3I = await Ethereum.getWeb3();

    socket.on('close', () => {

      logger.info('unsubscribing...');

      // logger.info('unsubscribing... subscriptionsContracts->' + subscriptionsContracts);
      // subscriptionsContracts.forEach((sub) => {
      //   sub.unsubscribe();
      // });

      _removeAddressFromSocket(uuid);

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
          if (validateSchema(dataObj, receiveMessageSchema, socket, consumerInstance)) {
            _subscribeTransactionsController(socket, uuid, dataObj.status, dataObj.body, web3I,
              pendingTransferEventEmitter, dataObj.consumer, true);
            logger.info('watch-transfers... pendingTransferEventEmitter->' + pendingTransferEventEmitter);
          }
          break;
        case 'watch-transactions':
          if (validateSchema(dataObj, receiveMessageSchema, socket, consumerInstance)) {
            _subscribeTransactionsController(socket, uuid, dataObj.status, dataObj.body, web3I,
              pendingTransactionEventEmitter, dataObj.consumer);
            logger.info('watch-transactions... pendingTransactionEventEmitter->' + pendingTransactionEventEmitter);
          }
          break;
        case 'watch-contracts':
          if (validateSchema(dataObj, receiveMessageSchema, socket, consumerInstance)) {
            _subscribeContractsController(socket, dataObj.body, web3I, subscriptionsContracts, subscriptionsContractsAddress, dataObj.consumer);
          }
          break;
        default:
          onError(socket, hancockMessageKindUnknownError, false, consumerInstance);
      }

    });

    if (addressOrAlias) {

      _subscribeContractsController(socket, [addressOrAlias], web3I, subscriptionsContracts, subscriptionsContractsAddress, consumer);

    } else if (sender) {

      _subscribeTransactionsController(socket, uuid, status, [sender], web3I, pendingTransactionEventEmitter, consumer, true);

    }

    if (socket.readyState === socket.OPEN) {
      socket.send(JSON.stringify({ kind: 'ready' }));
    }

  } catch (e) {

    logger.error(e);

  }

}
