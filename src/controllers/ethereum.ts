import * as http from 'http';
import * as url from 'url';
import * as WebSocket from 'ws';
import { IConsumer } from '../domain/consumers/consumer';
import { getConsumer } from '../domain/consumers/consumerFactory';
import { CONSUMERS } from '../domain/consumers/types';
import * as domain from '../domain/ethereum';
import {
  hancockContractNotFoundError,
  HancockError,
  hancockEventError,
  hancockGetBlockError,
  hancockGetCodeError,
  hancockLogsError,
  hancockNewBlockHeadersError,
  hancockParseError,
  hancockSubscribeToContractError,
  hancockSubscribeToTransferError,
  hancockSubscriptionUnknownError,
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

// tslint:disable-next-line:variable-name
export async function SocketSubscribeController(socket: WebSocket, req: http.IncomingMessage) {

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

  // Fix connection timeout problems
  // TODO: think about it and take a better solution
  setTimeout(() => {
    socket.send(JSON.stringify({ kind: 'ping', body: (new Date()).toISOString() }));
  }, 5000);

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
      case 'watch-addresses':
        _subscribeTransferController(socket, dataObj.body, web3I, subscriptions, dataObj.consumer);
        break;
      case 'watch-contracts':
        _subscribeContractsController(socket, dataObj.body, web3I, subscriptions, dataObj.consumer);
        break;
      default:
        _onError(socket, hancockSubscriptionUnknownError, false, consumerInstance);
    }

  });

  if (addressOrAlias) {

    _subscribeContractsController(socket, [addressOrAlias], web3I, subscriptions, consumer);

  } else if (sender) {

    _subscribeTransferController(socket, [sender], web3I, subscriptions, consumer);

  }

  socket.send(JSON.stringify({ kind: 'ready' }));

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
export const _subscribeTransferController = (
  socket: WebSocket, addresses: string[], web3I: any, subscriptions: any[], consumer: CONSUMERS = CONSUMERS.Default) => {

  const consumerInstance: IConsumer = getConsumer(socket, consumer);

  try {

    addresses.map((address: string) => {
      // Subscribe to pending transactions
      logger.info('Subscribing to mined transactions...');

      subscriptions.push(
        web3I.eth
          .subscribe('newBlockHeaders')
          .on('error', (err: Error) => _onError(socket, error(hancockNewBlockHeadersError, err), false, consumerInstance))
          .on('data', (blockMined: IEthBlockHeader) => {

            try {

              const blockBody = web3I.eth.getBlock(blockMined.hash, true);
              blockBody.transactions.map((txBody: IEthTransactionBody) => {

                if (txBody.from.toUpperCase() === address.toUpperCase()) {

                  try {

                    const code = web3I.eth.getCode(txBody.to);
                    if (code === '0x0') {
                      logger.info(`new tx =>> ${txBody.hash}, from: ${txBody.from}`);
                      consumerInstance.notify({ kind: 'tx', body: txBody, matchedAddress: txBody.from });
                    }

                  } catch (err) {

                    _onError(socket, error(hancockGetCodeError, err), false, consumerInstance);

                  }

                }

                if (txBody.to.toUpperCase() === address.toUpperCase()) {

                  logger.info(`new tx =>> ${txBody.hash}, from: ${txBody.from}`);
                  consumerInstance.notify({ kind: 'tx', body: txBody, matchedAddress: txBody.to });

                }
              });

            } catch (err) {

              _onError(socket, error(hancockGetBlockError, err), false, consumerInstance);

            }

          }),
      );
    });

  } catch (err) {

    _onError(socket, error(hancockSubscribeToTransferError, err), false, consumerInstance);

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
