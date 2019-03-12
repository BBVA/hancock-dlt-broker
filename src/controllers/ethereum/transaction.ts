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
import {IEthBlockHeader, IEthTransactionBody} from '../../models/ethereum';
import {CONSUMER_EVENT_KINDS, ISocketMessageStatus, MESSAGE_STATUS} from '../../models/models';
import {error, onError} from '../../utils/error';
import logger from '../../utils/logger';

export const transactionEventEmitter: any = {
  mined: {
    isSubscribed: false,
    event: undefined,
  },
  pending: {
    isSubscribed: false,
    event: undefined,
  },
};
export let transactionSubscriptionList: any[] = [];

export const subscribeTransactionsController = (
  socket: WebSocket,
  uuid: string,
  status: ISocketMessageStatus = MESSAGE_STATUS.Mined,
  addresses: string[],
  web3I: any,
  eventKind: CONSUMER_EVENT_KINDS,
  consumer: CONSUMERS = CONSUMERS.Default) => {

  const consumerInstance: IConsumer = getConsumer(socket, consumer);
  try {

    addresses.forEach((address: string) => {

      if (!_isSubscribed(transactionSubscriptionList, address, uuid, eventKind, status)) {

        transactionSubscriptionList.push({
          address,
          socketId: uuid,
          socket,
          consumer: consumerInstance,
          eventKind,
          status,
        });

        if (status === MESSAGE_STATUS.Pending && !transactionEventEmitter.pending.isSubscribed) {

          logger.info('Subscribing to pending transactions...');
          _createTransactionEventEmitterPending(web3I);

          // Default status, mined
        } else if (status === MESSAGE_STATUS.Mined && !transactionEventEmitter.mined.isSubscribed) {

          logger.info('Subscribing to mined transactions...');
          _createTransactionEventEmitterMined(web3I);

        }
      }
    });

  } catch (err) {

    onError(socket, error(hancockSubscribeToTransferError, err), false, consumerInstance);

  }

};

export const _createTransactionEventEmitterMined = async (web3I: any) => {
  transactionEventEmitter.mined.event = web3I.eth
    .subscribe('newBlockHeaders')
    .on('error', (err: Error) => _processOnError(error(hancockNewBlockHeadersError, err), false))
    .on('data', (blockMined: IEthBlockHeader) => {
      logger.debug('New block mined', blockMined.hash);
      _reactToNewBlock(web3I, blockMined);
    });
  transactionEventEmitter.mined.isSubscribed = true;
};

export const _createTransactionEventEmitterPending = async (web3I: any) => {
  transactionEventEmitter.pending.event = web3I.eth
    .subscribe('pendingTransactions')
    .on('error', (err: Error) => _processOnError(error(hancockPendingTransactionsSubscriptionError, err), false))
    .on('data', (txHash: string) => _reactToNewPendingTransaction(web3I, txHash));
  transactionEventEmitter.pending.isSubscribed = true;
};

export const _isSubscribed = (
  list: any[],
  address: string,
  uuid: string,
  eventKind: CONSUMER_EVENT_KINDS,
  status: ISocketMessageStatus = MESSAGE_STATUS.Mined,
) => {
  return list.some((obj) => {
    return (obj.address.toUpperCase() === address.toUpperCase() && obj.socketId === uuid && obj.eventKind === eventKind && obj.status === status);
  });
};

export const _reactToNewPendingTransaction = async (
  web3I: any,
  txHash: string,
) => {

  try {

    logger.debug('new pending transaction', txHash);
    const txBody: IEthTransactionBody = await web3I.eth.getTransaction(txHash, true);

    await _reactToTx(web3I, txBody, MESSAGE_STATUS.Pending);

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
        return await new Promise(async (resolve, reject) => {
          setTimeout(async () => {
            logger.debug('Trying attempt %s for block %s...', currentAttempt, blockMined.hash);
            resolve(await _getBlock(web3I, blockMined, currentAttempt));
          }, 3000);
        });
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
    logger.debug(`Block ${blockMined.hash} recovered, transactionsRoot: ${JSON.stringify(blockBody.transactionsRoot)}`);

    return await Promise.all(blockBody.transactions.map((txBody: IEthTransactionBody) =>
      _reactToTx(web3I, txBody),
    ));

  } catch (err) {
    _processOnError(err, false);
  }
};
export const _reactToTx = async (
  web3I: any,
  txBody: IEthTransactionBody,
  status: ISocketMessageStatus = MESSAGE_STATUS.Mined,
) => {

  transactionSubscriptionList.forEach(async (obj) => {

    if (obj.status === status) {

      if (txBody.from && txBody.from.toUpperCase() === obj.address.toUpperCase()) {
        logger.debug(`Transaction ${txBody.hash} body:  ${JSON.stringify(txBody, undefined, 2)}`);
        logger.info(`Transaction ${txBody.hash} match from field with address ${txBody.from}`);

        _notifyConsumer(txBody.from, txBody, obj, web3I);

      } else if (txBody.to && txBody.to.toUpperCase() === obj.address.toUpperCase()) {
        logger.debug(`Transaction ${txBody.hash} body:  ${JSON.stringify(txBody, undefined, 2)}`);
        logger.info(`Transaction ${txBody.hash} match to field with address ${txBody.to}`);

        _notifyConsumer(txBody.to, txBody, obj, web3I);
      }

    }
  });
};

export const _notifyConsumer = async (matchedAddress: string, txBody: IEthTransactionBody, subscription: any, web3I: any) => {
  const isSmartContractRelated = await _isSmartContractTransaction(subscription.socket, subscription.consumer, web3I, txBody);

  if (subscription.eventKind === CONSUMER_EVENT_KINDS.SmartContractTransaction && isSmartContractRelated) {
    subscription.consumer.notify({kind: CONSUMER_EVENT_KINDS.SmartContractTransaction, body: txBody, matchedAddress});
  } else if (subscription.eventKind === CONSUMER_EVENT_KINDS.Transfer && !isSmartContractRelated) {
    subscription.consumer.notify({kind: CONSUMER_EVENT_KINDS.Transfer, body: txBody, matchedAddress});
  } else if (subscription.eventKind === CONSUMER_EVENT_KINDS.Transaction) {
    subscription.consumer.notify({kind: CONSUMER_EVENT_KINDS.Transaction, body: txBody, matchedAddress});
  }

  // Deprecated
  subscription.consumer.notify({kind: 'tx', body: txBody, matchedAddress});
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

export const unsubscribeTransactionsController = (
  uuid: string,
  status: ISocketMessageStatus = MESSAGE_STATUS.Mined,
  addresses: string[] = [],
  eventKind: CONSUMER_EVENT_KINDS | undefined = undefined) => {

  const newList: any[] = [];

  if (addresses.length && eventKind) {
    transactionSubscriptionList.forEach((obj) => {
      const remove = addresses.some((address) => {
        return (obj.address === address && obj.socketId === uuid &&
          obj.status === status && obj.eventKind === eventKind);
      });
      if (!remove) {
        newList.push(obj);
      }
    });
  } else {
    for (const iterator of transactionSubscriptionList) {
      if (iterator.socketId !== uuid) {
        newList.push(iterator);
      }
    }
  }

  if (transactionEventEmitter.mined.isSubscribed &&
    (newList.length === 0 || !newList.some((subscription) => subscription.status === MESSAGE_STATUS.Mined))) {
    transactionEventEmitter.mined.event.unsubscribe((err: any, success: boolean) => {
      if (success) {
        logger.info('Successfully unsubscribed!');
      } else {
        logger.debug('Unsubscription failed: ', err);
      }
    });
    transactionEventEmitter.mined.isSubscribed = false;
  }
  if (transactionEventEmitter.pending.isSubscribed &&
    (newList.length === 0 || !newList.some((subscription) => subscription.status === MESSAGE_STATUS.Pending))) {
    transactionEventEmitter.pending.event.unsubscribe((err: any, success: boolean) => {
      if (success) {
        logger.info('Successfully unsubscribed!');
      } else {
        logger.debug('Unsubscription failed: ', err);
      }
    });
    transactionEventEmitter.pending.isSubscribed = false;
  }

  transactionSubscriptionList = newList;
};

export const _cleantransactionSubscriptionList = () => {
  transactionSubscriptionList = [];
};
