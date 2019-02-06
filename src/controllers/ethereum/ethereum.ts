import * as fs from 'fs';
import * as http from 'http';
import * as path from 'path';
import * as url from 'url';
import { v4 as uuidv4 } from 'uuid';
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
import { _closeConnectionSocket, _subscribeContractsController } from './contract';
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

    const uuid: string = uuidv4();
    const web3I = await Ethereum.getWeb3();

    socket.on('close', () => {

      logger.info('unsubscribing...');

      // logger.info('unsubscribing... subscriptionsContracts->' + subscriptionsContracts);
      // subscriptionsContracts.forEach((sub) => {
      //   sub.unsubscribe();
      // });

      _removeAddressFromSocket(uuid);
      _closeConnectionSocket(uuid);
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
            _subscribeTransactionsController(socket, uuid, dataObj.status, dataObj.body, web3I, dataObj.consumer, true);
          }
          break;
        case 'watch-transactions':
          if (validateSchema(dataObj, receiveMessageSchema, socket, consumerInstance)) {
            _subscribeTransactionsController(socket, uuid, dataObj.status, dataObj.body, web3I, dataObj.consumer);
          }
          break;
        case 'watch-contracts':
          if (validateSchema(dataObj, receiveMessageSchema, socket, consumerInstance)) {
            _subscribeContractsController(socket, uuid, dataObj.body, web3I, dataObj.consumer);
          }
          break;
        default:
          onError(socket, hancockMessageKindUnknownError, false, consumerInstance);
      }

    });

    if (addressOrAlias) {

      _subscribeContractsController(socket, uuid, [addressOrAlias], web3I, consumer);

    } else if (sender) {

      _subscribeTransactionsController(socket, uuid, status, [sender], web3I, consumer, true);

    }

    if (socket.readyState === socket.OPEN) {
      socket.send(JSON.stringify({ kind: 'ready' }));
    }

  } catch (e) {

    logger.error(e);

  }

}
