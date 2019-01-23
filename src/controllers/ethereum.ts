import * as fs from 'fs';
import * as http from 'http';
import * as path from 'path';
import * as url from 'url';
import * as WebSocket from 'ws';
import { IConsumer } from '../domain/consumers/consumer';
import { getConsumer } from '../domain/consumers/consumerFactory';
import { CONSUMERS } from '../domain/consumers/types';
import * as domain from '../domain/ethereum';
import {
  hancockContractNotFoundError,
  hancockEventError,
  hancockGetBlockError,
  hancockGetCodeError,
  hancockLogsError,
  hancockMessageKindUnknownError,
  hancockNewBlockHeadersError,
  hancockParseError,
  hancockPendingTransactionsSubscriptionError,
  hancockSubscribeToContractError,
  hancockSubscribeToTransferError,
} from '../models/error';
import {
  IEthBlockHeader,
  IEthContractEventBody,
  IEthContractLogBody,
  IEthereumContractModel,
  IEthTransactionBody,
} from '../models/ethereum';
import { ISocketMessage, ISocketMessageStatus } from '../models/models';
import { error, onError } from '../utils/error';
import * as Ethereum from '../utils/ethereum';
import logger from '../utils/logger';
import { validateSchema } from '../utils/schema';

const schemaPath: string = path.normalize(__dirname + '/../../../raml/schemas');
const receiveMessageSchema = JSON.parse(fs.readFileSync(`${schemaPath}/requests/receiveMessage.json`, 'utf-8'));

// tslint:disable-next-line:variable-name
export async function SocketSubscribeController(socket: WebSocket, req: http.IncomingMessage) {

  try {

    const { query } = url.parse(req.url as string, true);

    const addressOrAlias: string = (query.address || query.alias) as string;
    const sender: string = query.sender as string;
    const status: ISocketMessageStatus = query.status === 'pending' ? query.status : 'mined';
    const consumer: CONSUMERS = query.consumer as CONSUMERS;

    logger.info('Incoming socket connection => ', consumer, addressOrAlias || sender);

    const subscriptions: any[] = [];
    const web3I = await Ethereum.getWeb3();

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
          if (validateSchema(dataObj, receiveMessageSchema, socket, consumerInstance)) {
            _subscribeTransactionsController(socket, dataObj.status, dataObj.body, web3I, subscriptions, dataObj.consumer, true);
          }
          break;
        case 'watch-transactions':
          if (validateSchema(dataObj, receiveMessageSchema, socket, consumerInstance)) {
            _subscribeTransactionsController(socket, dataObj.status, dataObj.body, web3I, subscriptions, dataObj.consumer);
          }
          break;
        case 'watch-contracts':
          if (validateSchema(dataObj, receiveMessageSchema, socket, consumerInstance)) {
            _subscribeContractsController(socket, dataObj.body, web3I, subscriptions, dataObj.consumer);
          }
          break;
        default:
          onError(socket, hancockMessageKindUnknownError, false, consumerInstance);
      }

    });

    if (addressOrAlias) {

      _subscribeContractsController(socket, [addressOrAlias], web3I, subscriptions, consumer);

    } else if (sender) {

      _subscribeTransactionsController(socket, status, [sender], web3I, subscriptions, consumer, true);

    }

    socket.send(JSON.stringify({ kind: 'ready' }));

  } catch (e) {

    logger.error(e);

  }

}

// tslint:disable-next-line:variable-name
export const _subscribeContractsController = async (
  socket: WebSocket, contracts: string[], web3I: any, subscriptions: any[], consumer: CONSUMERS = CONSUMERS.Default) => {

  const consumerInstance: IConsumer = getConsumer(socket, consumer);

  contracts.forEach(async (contractAddressOrAlias: string) => {

    try {

      const ethContractModel: IEthereumContractModel | null = await domain.findOne(contractAddressOrAlias);

      if (ethContractModel) {

        const web3Contract: any = new web3I.eth.Contract(ethContractModel.abi, ethContractModel.address);
        // Subscribe to contract events
        logger.info('Subscribing to contract events...');
        subscriptions.push(
          web3Contract.events
            .allEvents({
              address: ethContractModel.address,
            })
            .on('error', (err: Error) => onError(socket, error(hancockEventError, err), false, consumerInstance))
            .on('data', (eventBody: IEthContractEventBody) => {
              // tslint:disable-next-line:max-line-length
              logger.info(`new event from contract ${ethContractModel.alias} =>> ${eventBody.id} (${eventBody.event}) `);
              // socket.send(JSON.stringify({ kind: 'event', body: eventBody }));
              consumerInstance.notify({ kind: 'event', body: eventBody, matchedAddress: ethContractModel.address });

            }),
        );

        // Subscribe to contract logs (Events)
        logger.info('Subscribing to contract logs...');
        subscriptions.push(
          web3I.eth
            .subscribe('logs', {
              address: ethContractModel.address,
            })
            .on('error', (err: Error) => onError(socket, error(hancockLogsError, err), false, consumerInstance))
            .on('data', (logBody: IEthContractLogBody) => {

              logger.info(`new log from contract ${ethContractModel.alias} =>> ${logBody.id}`);
              // socket.send(JSON.stringify({ kind: 'log', body: logBody }));
              consumerInstance.notify({ kind: 'log', body: logBody, matchedAddress: ethContractModel.address });

            }),
        );

      } else {
        onError(socket, hancockContractNotFoundError, false, consumerInstance);
      }

    } catch (err) {

      onError(socket, error(hancockSubscribeToContractError, err), false, consumerInstance);

    }
  });
};

// tslint:disable-next-line:variable-name
export const _subscribeTransactionsController = (
  socket: WebSocket,
  status: ISocketMessageStatus,
  addresses: string[],
  web3I: any,
  subscriptions: any[],
  consumer: CONSUMERS = CONSUMERS.Default,
  onlyTransfers: boolean = false) => {

  const consumerInstance: IConsumer = getConsumer(socket, consumer);

  try {

    addresses.forEach((address: string) => {

      if (status === 'pending') {

        logger.info('Subscribing to pending transactions...');

        subscriptions.push(
          web3I.eth
            .subscribe('pendingTransactions')
            .on('error', (err: Error) => onError(socket, error(hancockPendingTransactionsSubscriptionError, err), false, consumerInstance))
            .on('data', (pendingTx: IEthTransactionBody) => _reactToTx(socket, address, web3I, pendingTx, consumerInstance, onlyTransfers)),
        );

        // Default status, mined
      } else {

        logger.info('Subscribing to mined transactions...');

        subscriptions.push(
          web3I.eth
            .subscribe('newBlockHeaders')
            .on('error', (err: Error) => onError(socket, error(hancockNewBlockHeadersError, err), false, consumerInstance))
            .on('data', (blockMined: IEthBlockHeader) => _reactToNewBlock(socket, address, web3I, blockMined, consumerInstance, onlyTransfers)),
        );

      }

    });

  } catch (err) {

    onError(socket, error(hancockSubscribeToTransferError, err), false, consumerInstance);

  }

};

export const _reactToNewBlock = async (
  socket: WebSocket,
  address: string,
  web3I: any,
  blockMined: IEthBlockHeader,
  consumerInstance: IConsumer,
  onlyTransfers: boolean,
) => {

  try {

    logger.debug('newBlock mined', blockMined.hash);

    const blockBody = await web3I.eth.getBlock(blockMined.hash, true);

    return await Promise.all(blockBody.transactions.map((txBody: IEthTransactionBody) =>
      _reactToTx(socket, address, web3I, txBody, consumerInstance, onlyTransfers),
    ));

  } catch (err) {

    onError(socket, error(hancockGetBlockError, err), false, consumerInstance);

  }
};

async function _reactToTx(
  socket: WebSocket,
  address: string,
  web3I: any,
  txBody: IEthTransactionBody,
  consumerInstance: IConsumer,
  onlyTransfers: boolean,
) {

  if (txBody.from && txBody.from.toUpperCase() === address.toUpperCase()) {

    const isSmartContractRelated = await isSmartContractTransaction(socket, consumerInstance, web3I, txBody);
    const sendTx = !(onlyTransfers && isSmartContractRelated);

    if (sendTx) {
      logger.info(`new tx =>> ${txBody.hash}, from: ${txBody.from}`);
      consumerInstance.notify({ kind: 'tx', body: txBody, matchedAddress: txBody.from });
    }

  }

  if (txBody.to && txBody.to.toUpperCase() === address.toUpperCase()) {

    logger.info(`new tx =>> ${txBody.hash}, from: ${txBody.from}`);
    consumerInstance.notify({ kind: 'tx', body: txBody, matchedAddress: txBody.to });

  }

}

async function isSmartContractTransaction(socket: WebSocket, consumerInstance: IConsumer, web3I: any, txBody: IEthTransactionBody): Promise<boolean> {

  if (txBody.to === null) {

    return true;

  } else {

    let code: string;

    try {

      code = await web3I.eth.getCode(txBody.to);

      if (code === '0x0' || code === '0x') {

        return true;

      }

    } catch (err) {

      onError(socket, error(hancockGetCodeError, err), false, consumerInstance);

    }

  }

  return false;

}
