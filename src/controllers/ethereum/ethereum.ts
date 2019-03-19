import * as fs from 'fs';
import * as http from 'http';
import * as path from 'path';
import * as url from 'url';
import {v4 as uuidv4} from 'uuid';
import * as WebSocket from 'ws';
import {IConsumer} from '../../domain/consumers/consumer';
import {getConsumer} from '../../domain/consumers/consumerFactory';
import {CONSUMERS} from '../../domain/consumers/types';
import {hancockMessageKindUnknownError, hancockParseError} from '../../models/error';
import {CONSUMER_EVENT_KINDS, ISocketMessage, ISocketMessageStatus, MESSAGE_STATUS, SOCKET_EVENT_KINDS} from '../../models/models';
import {error, onError} from '../../utils/error';
import * as Ethereum from '../../utils/ethereum';
import logger from '../../utils/logger';
import {validateSchema} from '../../utils/schema';
import {_closeConnectionSocket, subscribeContractsController, unsubscribeContractsController} from './contract';
import {subscribeTransactionsController, unsubscribeTransactionsController} from './transaction';

const schemaPath: string = path.normalize(__dirname + '/../../../../raml/schemas');
const receiveMessageSchema = JSON.parse(fs.readFileSync(`${schemaPath}/requests/receiveMessage.json`, 'utf-8'));

export async function SocketSubscribeController(socket: WebSocket, req: http.IncomingMessage) {

  try {

    const { query } = url.parse(req.url as string, true);

    const addressOrAlias: string = (query.address || query.alias) as string;
    const sender: string = query.sender as string;
    const status: ISocketMessageStatus = query.status === MESSAGE_STATUS.Pending ? query.status : MESSAGE_STATUS.Mined;
    const consumer: CONSUMERS = query.consumer as CONSUMERS;

    logger.info('Incoming socket connection => ', consumer, addressOrAlias || sender);

    const uuid: string = uuidv4();
    const web3I = await Ethereum.getWeb3();

    socket.on('close', () => {

      logger.info('unsubscribing...');

      unsubscribeTransactionsController(uuid);
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
        case SOCKET_EVENT_KINDS.WatchTransfer:
          if (validateSchema(dataObj, receiveMessageSchema, socket, consumerInstance)) {
            subscribeTransactionsController(socket, uuid, dataObj.status, dataObj.body, web3I, CONSUMER_EVENT_KINDS.Transfer, dataObj.consumer);
          }
          break;
        case SOCKET_EVENT_KINDS.WatchTransaction:
          if (validateSchema(dataObj, receiveMessageSchema, socket, consumerInstance)) {
            subscribeTransactionsController(socket, uuid, dataObj.status, dataObj.body, web3I, CONSUMER_EVENT_KINDS.Transaction, dataObj.consumer);
          }
          break;
        case SOCKET_EVENT_KINDS.WatchSmartContractTransaction:
          if (validateSchema(dataObj, receiveMessageSchema, socket, consumerInstance)) {
            subscribeTransactionsController(socket, uuid, dataObj.status, dataObj.body, web3I, CONSUMER_EVENT_KINDS.SmartContractTransaction, dataObj.consumer);
          }
          break;
        case SOCKET_EVENT_KINDS.WatchSmartContractEvent:
        case SOCKET_EVENT_KINDS.ObsoleteWatchSmartContractEvent:
          if (validateSchema(dataObj, receiveMessageSchema, socket, consumerInstance)) {
            subscribeContractsController(socket, uuid, dataObj.body, web3I, dataObj.consumer);
          }
          break;
        case SOCKET_EVENT_KINDS.UnwatchTransfer:
          if (validateSchema(dataObj, receiveMessageSchema, socket, consumerInstance)) {
            unsubscribeTransactionsController(uuid, dataObj.status, dataObj.body, CONSUMER_EVENT_KINDS.Transfer);
          }
          break;
        case SOCKET_EVENT_KINDS.UnwatchTransaction:
          if (validateSchema(dataObj, receiveMessageSchema, socket, consumerInstance)) {
            unsubscribeTransactionsController(uuid, dataObj.status, dataObj.body, CONSUMER_EVENT_KINDS.Transaction);
          }
          break;
        case SOCKET_EVENT_KINDS.UnwatchSmartContractTransaction:
          if (validateSchema(dataObj, receiveMessageSchema, socket, consumerInstance)) {
            unsubscribeTransactionsController(uuid, dataObj.status, dataObj.body, CONSUMER_EVENT_KINDS.SmartContractTransaction);
          }
          break;
        case SOCKET_EVENT_KINDS.UnwatchSmartContractEvent:
        case SOCKET_EVENT_KINDS.ObsoleteUnwatchSmartContractEvent:
          if (validateSchema(dataObj, receiveMessageSchema, socket, consumerInstance)) {
            unsubscribeContractsController(uuid, dataObj.body);
          }
          break;
        default:
          onError(socket, hancockMessageKindUnknownError, false, consumerInstance);
      }

    });

    if (addressOrAlias) {

      subscribeContractsController(socket, uuid, [addressOrAlias], web3I, consumer);

    } else if (sender) {

      subscribeTransactionsController(socket, uuid, status, [sender], web3I, CONSUMER_EVENT_KINDS.Transfer, consumer);

    }

    if (socket.readyState === socket.OPEN) {
      socket.send(JSON.stringify({ kind: 'ready' }));
    }

  } catch (e) {

    logger.error(e);

  }

}
