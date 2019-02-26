
import { EventEmitter } from 'events';
import * as WebSocket from 'ws';
import { IConsumer } from '../../domain/consumers/consumer';
import { getConsumer } from '../../domain/consumers/consumerFactory';
import { CONSUMERS } from '../../domain/consumers/types';
import {
  HancockError,
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

export let transactionEventEmitterMined: EventEmitter | undefined;
export let transactionEventEmitterPending: EventEmitter | undefined;
export let transactionSubscriptionList: any[] = [];

// tslint:disable-next-line:variable-name
export const subscribeTransactionsController = (
  socket: WebSocket,
  uuid: string,
  status: ISocketMessageStatus = 'mined',
  addresses: string[],
  web3I: any,
  consumer: CONSUMERS = CONSUMERS.Default,
  onlyTransfers: boolean = false) => {

  const consumerInstance: IConsumer = getConsumer(socket, consumer);
  try {

    addresses.forEach((address: string) => {

      if (!_isSubscribed(transactionSubscriptionList, address, uuid)) {

        transactionSubscriptionList.push({
          address,
          socketId: uuid,
          socket,
          consumer: consumerInstance,
          onlyTransfers,
          status,
        });

        if (status === 'pending' && !transactionEventEmitterPending) {

          logger.info('Subscribing to pending transactions...');
          _createTransactionEventEmitterPending(web3I);

          // Default status, mined
        } else if (status === 'mined' && !transactionEventEmitterMined) {

          logger.info('Subscribing to mined transactions...');
          _createTransactionEventEmitterMined(web3I);

        }
      }
    });

  } catch (err) {

    onError(socket, error(hancockSubscribeToTransferError, err), false, consumerInstance);

  }

};

export const _removeAddressFromSocket = (uuid: string) => {
  const newArraySub: any[] = [];
  for (const iterator of transactionSubscriptionList) {
    if (iterator.socketId !== uuid) {
      newArraySub.push(iterator);
    }
  }
  transactionSubscriptionList = newArraySub;
};

export const _createTransactionEventEmitterMined = async (web3I: any) => {
  transactionEventEmitterMined = web3I.eth
    .subscribe('newBlockHeaders')
    .on('error', (err: Error) => _processOnError(error(hancockNewBlockHeadersError, err), false))
    .on('data', (blockMined: IEthBlockHeader) => _reactToNewBlock(web3I, blockMined));
};

export const _createTransactionEventEmitterPending = async (web3I: any) => {
  transactionEventEmitterPending = web3I.eth
    .subscribe('pendingTransactions')
    .on('error', (err: Error) => _processOnError(error(hancockPendingTransactionsSubscriptionError, err), false))
    .on('data', (txHash: string) => _reactToNewPendingTransaction(web3I, txHash));
};

export const _isSubscribed = (list: any[], address: string, uuid: string) => {
  // tslint:disable-next-line:no-var-keyword
  var response: boolean = false;
  list.forEach((obj) => {
    if (obj.address.toUpperCase() === address.toUpperCase() && obj.socketId === uuid ) {
      response = true;
    }
  });
  return response;
};

export const _reactToNewPendingTransaction = async (
  web3I: any,
  txHash: string,
) => {

  try {

    logger.debug('new pending transaction', txHash);
    const txBody: IEthTransactionBody = await web3I.eth.getTransaction(txHash, true);

    await _reactToTx(web3I, txBody, 'pending');

  } catch (err) {

    _processOnError(error(hancockTransactionError, err), false);

  }
};

export const _reactToNewBlock = async (
  web3I: any,
  blockMined: IEthBlockHeader,
) => {

  try {

    logger.debug('newBlock mined', blockMined.hash);

    const blockBody = await web3I.eth.getBlock(blockMined.hash, true);

    return await Promise.all(blockBody.transactions.map((txBody: IEthTransactionBody) =>
      _reactToTx(web3I, txBody, 'mined'),
    ));

  } catch (err) {

    _processOnError(error(hancockGetBlockError, err), false);

  }
};
export const _reactToTx = async (
  web3I: any,
  txBody: IEthTransactionBody,
  status: string,
) => {

  transactionSubscriptionList.forEach(async (obj) => {

    if (obj.status === status) {

      if (txBody.from && txBody.from.toUpperCase() === obj.address.toUpperCase()) {

        // const isSmartContractRelated = await _isSmartContractTransaction(obj.socket, obj.consumer, web3I, txBody);
        // const sendTx = !(obj.onlyTransfers && isSmartContractRelated);

        if (true) {
          logger.debug(`-------> ${JSON.stringify(txBody, undefined, 2)}`);
          logger.info(`new tx =>> ${txBody.hash}, from: ${txBody.from}`);
          obj.consumer.notify({ kind: 'tx', body: txBody, matchedAddress: txBody.from });
        }

      }

      if (txBody.to && txBody.to.toUpperCase() === obj.address.toUpperCase()) {
        logger.debug(`-------> ${JSON.stringify(txBody, undefined, 2)}`);
        logger.info(`new tx =>> ${txBody.hash}, to: ${txBody.to} from: ${txBody.from}`);
        obj.consumer.notify({ kind: 'tx', body: txBody, matchedAddress: txBody.to });
      }

    }
  });
};

export const _isSmartContractTransaction = async (socket: WebSocket,
                                                  consumerInstance: IConsumer,
                                                  web3I: any,
                                                  txBody: IEthTransactionBody): Promise<boolean> => {

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

};

export const _processOnError = (err: HancockError, terminate: boolean) => {
  transactionSubscriptionList.forEach(async (obj) => {
    onError(obj.socket, err, false, obj.consumer);
  });
};
