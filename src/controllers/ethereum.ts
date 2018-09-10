import * as fs from 'fs';
import * as http from 'http';
import { validate } from 'jsonschema';
import * as path from 'path';
import * as url from 'url';
import * as WebSocket from 'ws';
import { IConsumer } from '../domain/consumers/consumer';
import { getConsumer } from '../domain/consumers/consumerFactory';
import { CONSUMERS } from '../domain/consumers/types';
import * as domain from '../domain/ethereum';
import {
  hancockBadRequestError,
  hancockContractNotFoundError,
  HancockError,
  hancockEventError,
  hancockGetBlockError,
  hancockGetCodeError,
  hancockLogsError,
  hancockMessageKindUnknownError,
  hancockNewBlockHeadersError,
  hancockParseError,
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
import { ISocketMessage } from '../models/models';
import { error } from '../utils/error';
import * as Ethereum from '../utils/ethereum';
import logger from '../utils/logger';

const schemaPath: string = path.normalize(__dirname + '/../../../raml/schemas');
const receiveMessageSchema = JSON.parse(fs.readFileSync(`${schemaPath}/requests/recieveMessage.json`, 'utf-8'));

// tslint:disable-next-line:variable-name
export async function SocketSubscribeController(socket: WebSocket, req: http.IncomingMessage) {

  try {

    const { query } = url.parse(req.url as string, true);

    const addressOrAlias: string = (query.address || query.alias) as string;
    const sender: string = query.sender as string;
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

        _onError(socket, error(hancockParseError, err), false, consumerInstance);
        return;

      }

      logger.info('Incoming message => ', dataObj);

      switch (dataObj.kind) {
        case 'watch-transfers':
          if (_validateSchema(dataObj, receiveMessageSchema, socket, consumerInstance)) {
            _subscribeTransactionsController(socket, dataObj.body, web3I, subscriptions, dataObj.consumer, true);
          }
          break;
        case 'watch-transactions':
          if (_validateSchema(dataObj, receiveMessageSchema, socket, consumerInstance)) {
            _subscribeTransactionsController(socket, dataObj.body, web3I, subscriptions, dataObj.consumer);
          }
          break;
        case 'watch-contracts':
          if (_validateSchema(dataObj, receiveMessageSchema, socket, consumerInstance)) {
            _subscribeContractsController(socket, dataObj.body, web3I, subscriptions, dataObj.consumer);
          }
          break;
        default:
          _onError(socket, hancockMessageKindUnknownError, false, consumerInstance);
      }

    });

    if (addressOrAlias) {

      _subscribeContractsController(socket, [addressOrAlias], web3I, subscriptions, consumer);

    } else if (sender) {

      _subscribeTransactionsController(socket, [sender], web3I, subscriptions, consumer, true);

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

  contracts.map(async (contractAddressOrAlias: string) => {

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
            .on('error', (err: Error) => _onError(socket, error(hancockEventError, err), false, consumerInstance))
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
            .on('error', (err: Error) => _onError(socket, error(hancockLogsError, err), false, consumerInstance))
            .on('data', (logBody: IEthContractLogBody) => {

              logger.info(`new log from contract ${ethContractModel.alias} =>> ${logBody.id}`);
              // socket.send(JSON.stringify({ kind: 'log', body: logBody }));
              consumerInstance.notify({ kind: 'log', body: logBody, matchedAddress: ethContractModel.address });

            }),
        );

      } else {
        _onError(socket, hancockContractNotFoundError, false, consumerInstance);
      }

    } catch (err) {

      _onError(socket, error(hancockSubscribeToContractError, err), false, consumerInstance);

    }
  });
};

// tslint:disable-next-line:variable-name
export const _subscribeTransactionsController = (
  socket: WebSocket, addresses: string[], web3I: any, subscriptions: any[], consumer: CONSUMERS = CONSUMERS.Default, onlyTransfers: boolean = false) => {

  const consumerInstance: IConsumer = getConsumer(socket, consumer);

  try {

    addresses.forEach((address: string) => {
      // Subscribe to pending transactions
      logger.info('Subscribing to mined transactions...');

      subscriptions.push(
        web3I.eth
          .subscribe('newBlockHeaders')
          .on('error', (err: Error) => _onError(socket, error(hancockNewBlockHeadersError, err), false, consumerInstance))
          .on('data', (blockMined: IEthBlockHeader) => _reactToNewTransaction(socket, address, web3I, blockMined, consumerInstance, onlyTransfers)),
      );

    });

  } catch (err) {

    _onError(socket, error(hancockSubscribeToTransferError, err), false, consumerInstance);

  }

};

export const _reactToNewTransaction = async (
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

    return await Promise.all(blockBody.transactions.map(async (txBody: IEthTransactionBody) => {

      if (txBody.from && txBody.from.toUpperCase() === address.toUpperCase()) {

        try {

          const isSmartContractRelated = txBody.to === null || await web3I.eth.getCode(txBody.to) === '0x0';
          const sendTx = !onlyTransfers || !isSmartContractRelated;

          if (sendTx) {
            logger.info(`new tx =>> ${txBody.hash}, from: ${txBody.from}`);
            consumerInstance.notify({ kind: 'tx', body: txBody, matchedAddress: txBody.from });
          }

        } catch (err) {

          _onError(socket, error(hancockGetCodeError, err), false, consumerInstance);

        }

      }

      if (txBody.to && txBody.to.toUpperCase() === address.toUpperCase()) {

        logger.info(`new tx =>> ${txBody.hash}, from: ${txBody.from}`);
        consumerInstance.notify({ kind: 'tx', body: txBody, matchedAddress: txBody.to });

      }

    }));

  } catch (err) {

    _onError(socket, error(hancockGetBlockError, err), false, consumerInstance);

  }
};

export const _onError = async (socket: WebSocket, err: HancockError, terminate: boolean = false, consumer?: IConsumer) => {

  logger.error(err);

  try {

    if (consumer) {
      consumer.notify({ kind: 'error', body: err });
    } else {
      socket.send(JSON.stringify({ kind: 'error', body: err }));
    }

  } catch (innerErr) {

    logger.error(innerErr);

  }

  if (terminate) {
    socket.terminate();
  }
};

export const _validateSchema = (data: any, schema: any, socket: WebSocket, consumerInstance: IConsumer): boolean => {

  try {

    validate(data, schema, { throwError: true });
    return true;

  } catch (err) {

    const e: HancockError = error(hancockBadRequestError, err);
    _onError(socket, e, false, consumerInstance);
    return false;

  }

};
