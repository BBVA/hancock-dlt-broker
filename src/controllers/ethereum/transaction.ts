
import * as WebSocket from 'ws';
import { IConsumer } from '../../domain/consumers/consumer';
import { getConsumer } from '../../domain/consumers/consumerFactory';
import { CONSUMERS } from '../../domain/consumers/types';
import {
  hancockGetBlockError,
  hancockGetCodeError,
  hancockNewBlockHeadersError,
  hancockPendingTransactionsSubscriptionError,
  hancockSubscribeToTransferError,
  hancockTransactionError,
} from '../../models/error';
import {
  IEthBlockHeader,
  IEthTransactionBody,
} from '../../models/ethereum';
import { ISocketMessageStatus } from '../../models/models';
import { error, onError } from '../../utils/error';
import logger from '../../utils/logger';

// tslint:disable-next-line:variable-name
export const _subscribeTransactionsController = (
  socket: WebSocket,
  status: ISocketMessageStatus = 'mined',
  addresses: string[],
  web3I: any,
  subscriptions: any[],
  eventEmitter: any,
  consumer: CONSUMERS = CONSUMERS.Default,
  onlyTransfers: boolean = false) => {

  const consumerInstance: IConsumer = getConsumer(socket, consumer);
  logger.info('Subscribing to transactions... addresses -> ' + addresses);
  try {

    addresses.forEach((address: string) => {
      logger.info('address -> ' + address);
      logger.info('subscriptions.indexOf(address) -> ' + subscriptions.indexOf(address));
      if (subscriptions.indexOf(address) === -1) {
        subscriptions.push(address);
        if (status === 'pending') {

          logger.info('Subscribing to pending asdf transactions...');

          // eventEmitter = web3I.eth
          //     .subscribe('pendingTransactions')
          //     .on('error', (err: Error) => onError(socket, error(hancockPendingTransactionsSubscriptionError, err), false, consumerInstance))
          //     .on('data', (txHash: string) => _reactToNewPendingTransaction(socket, subscriptions, web3I, txHash, consumerInstance, onlyTransfers));

          // Default status, mined
        } else {

          logger.info('Subscribing to mined asdf transactions...');

          // eventEmitter = web3I.eth
          //     .subscribe('newBlockHeaders')
          //     .on('error', (err: Error) => onError(socket, error(hancockNewBlockHeadersError, err), false, consumerInstance))
          //     .on('data', (blockMined: IEthBlockHeader) => _reactToNewBlock(socket, subscriptions, web3I, blockMined, consumerInstance, onlyTransfers));

        }
      }
    });
    logger.info('return eventEmitter -> ' + eventEmitter);

  } catch (err) {

    onError(socket, error(hancockSubscribeToTransferError, err), false, consumerInstance);

  }

  return eventEmitter;

};

export const _reactToNewPendingTransaction = async (
  socket: WebSocket,
  subscriptions: string[],
  web3I: any,
  txHash: string,
  consumerInstance: IConsumer,
  onlyTransfers: boolean,
) => {

  try {

    logger.debug('new pending transaction', txHash);
    const txBody: IEthTransactionBody = await web3I.eth.getTransaction(txHash, true);

    await _reactToTx(socket, subscriptions, web3I, txBody, consumerInstance, onlyTransfers);

  } catch (err) {

    onError(socket, error(hancockTransactionError, err), false, consumerInstance);

  }
};

export const _reactToNewBlock = async (
  socket: WebSocket,
  subscriptions: string[],
  web3I: any,
  blockMined: IEthBlockHeader,
  consumerInstance: IConsumer,
  onlyTransfers: boolean,
) => {

  try {

    logger.debug('newBlock mined', blockMined.hash);

    const blockBody = await web3I.eth.getBlock(blockMined.hash, true);

    return await Promise.all(blockBody.transactions.map((txBody: IEthTransactionBody) =>
      _reactToTx(socket, subscriptions, web3I, txBody, consumerInstance, onlyTransfers),
    ));

  } catch (err) {

    onError(socket, error(hancockGetBlockError, err), false, consumerInstance);

  }
};

async function _reactToTx(
  socket: WebSocket,
  subscriptions: string[],
  web3I: any,
  txBody: IEthTransactionBody,
  consumerInstance: IConsumer,
  onlyTransfers: boolean,
) {

  logger.info(`_reactToTx subscriptions -------> ${subscriptions}`);
  subscriptions.forEach(async (address) => {
    logger.debug(`-------> ${JSON.stringify(txBody, undefined, 2)}`);
    logger.debug(`new transaction check hash[${txBody.hash}], from[${txBody.from}], to[${txBody.to}], address[${address}]`);

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
  });
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
