import * as WebSocket from 'ws';
import { IConsumer } from '../../domain/consumers/consumer';
import { getConsumer } from '../../domain/consumers/consumerFactory';
import {CONSUMERS} from '../../domain/consumers/types';
import * as domain from '../../domain/ethereum';
import {
  hancockContractNotFoundError,
  hancockEventError,
  hancockSubscribeToContractError,
} from '../../models/error';
import {
  IEthContractEventBody,
  IEthereumContractModel,
} from '../../models/ethereum';
import {CONSUMER_EVENT_KINDS, CURRENCY, IHancockSocketContractEventBody} from '../../models/models';
import { error, onError } from '../../utils/error';
import logger from '../../utils/logger';
import { _getBlock } from './transaction';

export let contractSubscriptionList: any[] = [];

// tslint:disable-next-line:variable-name
export const subscribeContractsController = async (
  socket: WebSocket, uuid: string, contracts: string[], web3I: any, consumer: CONSUMERS = CONSUMERS.Default) => {

  const consumerInstance: IConsumer = getConsumer(socket, consumer);

  contracts.forEach(async (contractAddressOrAlias: string) => {

    logger.info(`new subscribe =>> contractAddressOrAlias ${contractAddressOrAlias} `);
    try {

      const ethContractModel: IEthereumContractModel | null = await domain.findOne(contractAddressOrAlias);
      if (ethContractModel) {

        const state = _socketSubscriptionState(contractSubscriptionList, ethContractModel.address, uuid);
        if (state === 0) {

          const web3Contract: any = new web3I.eth.Contract(ethContractModel.abi, ethContractModel.address);
          _addNewContract(ethContractModel, web3Contract, web3I, uuid, socket, consumerInstance);

        } else if (state === 1) {

          _addNewSubscriptionToContract(ethContractModel, uuid, socket, consumerInstance);

        }

      } else {
        onError(socket, hancockContractNotFoundError, false, consumerInstance);
      }

    } catch (err) {

      onError(socket, error(hancockSubscribeToContractError, err), false, consumerInstance);

    }
  });
};

// tslint:disable-next-line:variable-name
export const _closeConnectionSocket = async (uuid: string) => {
  const newSubscriptionList: any[] = [];
  contractSubscriptionList.forEach((obj) => {
    const newList: any[] = [];
    obj.subscriptions.forEach((sub: any) => {
      if (sub.socketId !== uuid) {
        newList.push(sub);
      }
    });
    if (newList.length !== 0) {
      obj.subscriptions = newList;
      newSubscriptionList.push(obj);
    } else {
      obj.eventEmitterEvents.unsubscribe();
    }
  });
  contractSubscriptionList = newSubscriptionList;
};

export const _socketSubscriptionState = (list: any[], address: string, uuid: string) => {
  // tslint:disable-next-line:no-var-keyword
  var response: number = 0;
  list.forEach((obj) => {
    if (obj.contractAddress.toUpperCase() === address.toUpperCase()) {
      response = 1;
      obj.subscriptions.forEach((sub: any) => {
        if (sub.socketId === uuid) {
          response = 2;
        }
      });
    }
  });
  return response;
};

export const _addNewContract = (ethContractModel: IEthereumContractModel, web3Contract: any, web3I: any,
                                uuid: string, socket: WebSocket, consumerInstance: IConsumer) => {

  // tslint:disable-next-line:prefer-const
  let newSubscription = {
    contractAddress: ethContractModel.address,
    contractInstance: web3Contract,
    contractInfo: ethContractModel,
    eventEmitterEvents: web3Contract.events
      .allEvents({
        address: ethContractModel.address,
      })
      .on('error', (err: Error) => onError(socket, error(hancockEventError, err), false, consumerInstance))
      .on('data', (eventBody: IEthContractEventBody) => {
        // tslint:disable-next-line:max-line-length
        logger.info(`new event from contract ${ethContractModel.alias} =>> ${eventBody.id} (${eventBody.event}) `);
        contractSubscriptionList.forEach((obj) => {
          if (obj.contractAddress.toUpperCase() === ethContractModel.address.toUpperCase()) {
            obj.subscriptions.forEach((sub: any) => {
              _processEvent(sub, web3I, eventBody);
            });
          }
        });

      }),
    subscriptions: [{
      socketId: uuid,
      socket,
      consumerInstance,
    }],
  };
  contractSubscriptionList.push(newSubscription);
};

export const _addNewSubscriptionToContract = (ethContractModel: IEthereumContractModel,
                                              uuid: string, socket: WebSocket, consumerInstance: IConsumer) => {

  contractSubscriptionList.forEach((obj) => {
    if (obj.contractAddress.toUpperCase() === ethContractModel.address.toUpperCase()) {
      obj.subscriptions.push({
        socketId: uuid,
        socket,
        consumerInstance,
      });
    }
  });
};

// tslint:disable-next-line:variable-name
export const unsubscribeContractsController = (
  uuid: string,
  contracts: string[]) => {

  const newSubscriptionList: any[] = [];

  contractSubscriptionList.forEach((obj) => {
    const newList: any[] = [];
    contracts.forEach((address) => {
      // tslint:disable-next-line:no-var-keyword
      var checked = false;
      if (obj.contractAddress.toUpperCase() === address.toUpperCase()) {
        checked = true;
        obj.subscriptions.forEach((sub: any) => {
          if (sub.socketId !== uuid) {
            newList.push(sub);
          }
        });
        if (newList.length !== 0) {
          obj.subscriptions = newList;
          newSubscriptionList.push(obj);
        } else {
          obj.eventEmitterEvents.unsubscribe();
        }
      }
      if (!checked) {
        newSubscriptionList.push(obj);
      }
    });
  });

  contractSubscriptionList = newSubscriptionList;
};

export const _restartSubscriptionsContracts = (web3Instance: any) => {
  contractSubscriptionList.forEach((contract) => {
    logger.info('Resubscribing to contracts events and logs for contract => ', contract.contractAddress);
    contract.eventEmitterEvents = contract.contractInstance.events
    .allEvents({
      address: contract.contractAddress,
    })
    .on('data', (eventBody: IEthContractEventBody) => {
      // tslint:disable-next-line:max-line-length
      logger.info(`new event from contract ${contract.contractInfo.alias} =>> ${eventBody.id} (${eventBody.event}) `);
      contractSubscriptionList.forEach((obj) => {
        if (obj.contractAddress.toUpperCase() === contract.contractInfo.address.toUpperCase()) {
          obj.subscriptions.forEach((sub: any) => {
            _processEvent(sub, web3Instance, eventBody);
          });
        }
      });
    });
  });
};

export const _processEvent = async (
  sub: any,
  web3I: any,
  eventBody: IEthContractEventBody,
) => {
  const blockHeader = await _getBlock(web3I, eventBody.blockHash);
  // tslint:disable-next-line:no-var-keyword
  var transaction: any = {};
  blockHeader.transactions.forEach((tx: any) => {
    if (tx.hash === eventBody.transactionHash) {
      transaction = tx;
    }
  });
  logger.info(`new event from contract ${eventBody.address} sent to the socket with uuid =>> ${sub.socketId}  `);
  sub.consumerInstance.notify({
    kind: CONSUMER_EVENT_KINDS.SmartContractEvent,
    body: _generateBody(eventBody, (transaction.gas * Number(transaction.gasPrice)).toString(), blockHeader.timestamp),
    raw: eventBody,
    matchedAddress: eventBody.address,
  });
};

export const _generateBody = (eventBody: IEthContractEventBody, fee: string, timestamp: number) => {
  const body: IHancockSocketContractEventBody = {
    blockNumber: eventBody.blockNumber,
    blockHash: eventBody.blockHash,
    transactionId: eventBody.transactionHash,
    smartContractAddress: eventBody.address,
    eventName: eventBody.event,
    returnValues: eventBody.returnValues,
    fee: {
      amount: fee,
      decimals: 18,
      currency: CURRENCY.Ethereum,
    },
    timestamp,
  };
  return body;
};
