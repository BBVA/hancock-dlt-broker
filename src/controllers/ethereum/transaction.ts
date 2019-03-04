import {EventEmitter} from 'events';
import * as WebSocket from 'ws';
import {IConsumer} from '../../domain/consumers/consumer';
import {getConsumer} from '../../domain/consumers/consumerFactory';
import {CONSUMERS} from '../../domain/consumers/types';
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
import {ISocketMessageStatus} from '../../models/models';
import {error, onError} from '../../utils/error';
import logger from '../../utils/logger';

export let transactionEventEmitterMined: EventEmitter | undefined;
export let transactionEventEmitterPending: EventEmitter | undefined;
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
    .on('data', (blockMined: IEthBlockHeader) => {
      logger.debug('New block mined', blockMined.hash);
      _reactToNewBlock(web3I, blockMined);
    });
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
    if (obj.address.toUpperCase() === address.toUpperCase() && obj.socketId === uuid) {
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

export const _getBlock = async (
  web3I: any,
  blockMined: IEthBlockHeader,
  currentAttempt: number = 1,
  maxAttempts: number = 3,
) => {
  let blockBody;
  try {
    blockBody = await web3I.eth.getBlock(blockMined.hash, true);

    if (blockBody && blockBody.transactions) {
      return blockBody;
    } else {
      logger.debug(`The block ${blockMined.hash} is mined but it is not ready yet`);
      logger.debug('Attempt %s failed for block %s', currentAttempt, blockMined.hash);
      currentAttempt++;
      if (currentAttempt <= maxAttempts) {
        logger.debug(`Waiting for block ${blockMined.hash}...`);
        setTimeout(async () => {
          logger.debug('Trying attempt %s for block %s...', currentAttempt, blockMined.hash);
          return await _getBlock(web3I, blockMined, currentAttempt);
        }, 3000);
      } else {
        throw new Error(hancockGetBlockError.message);
      }
    }
  } catch (err) {
    throw new Error(err);
  }
};

export const _reactToNewBlock = async (
  web3I: any,
  blockMined: IEthBlockHeader,
) => {
  try {
    const blockBody = await _getBlock(web3I, blockMined);
    logger.debug(`Block ${blockMined.hash} recovered`);

    return await Promise.all(blockBody.transactions.map((txBody: IEthTransactionBody) =>
      _reactToTx(web3I, txBody, 'mined'),
    ));

  } catch (err) {
    _processOnError(err, false);
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

        const isSmartContractRelated = await _isSmartContractTransaction(obj.socket, obj.consumer, web3I, txBody);
        const sendTx = !(obj.onlyTransfers && isSmartContractRelated);

        if (sendTx) {
          logger.debug(`-------> ${JSON.stringify(txBody, undefined, 2)}`);
          logger.info(`new tx =>> ${txBody.hash}, from: ${txBody.from}`);
          obj.consumer.notify({kind: 'tx', body: txBody, matchedAddress: txBody.from});
        }

      }

      if (txBody.to && txBody.to.toUpperCase() === obj.address.toUpperCase()) {
        logger.debug(`-------> ${JSON.stringify(txBody, undefined, 2)}`);
        logger.info(`new tx =>> ${txBody.hash}, to: ${txBody.to} from: ${txBody.from}`);
        obj.consumer.notify({kind: 'tx', body: txBody, matchedAddress: txBody.to});
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

      if (code !== '0x0' && code !== '0x') {

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

// tslint:disable-next-line:variable-name
export const unsubscribeTransactionsController = (
  uuid: string,
  status: ISocketMessageStatus = 'mined',
  addresses: string[],
  onlyTransfers: boolean = false) => {

  const newList: any[] = [];

  transactionSubscriptionList.forEach((obj) => {
    // tslint:disable-next-line:no-var-keyword
    var remove = false;
    addresses.forEach((address) => {
      if (obj.address === address && obj.socketId === uuid &&
        obj.status === status && obj.onlyTransfers === onlyTransfers) {
        remove = true;
      }
    });
    if (!remove) {
      newList.push(obj);
    }
  });

  transactionSubscriptionList = newList;
};
