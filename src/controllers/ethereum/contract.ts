import * as WebSocket from 'ws';
import {IConsumer} from '../../domain/consumers/consumer';
import {getConsumer} from '../../domain/consumers/consumerFactory';
import * as domain from '../../domain/ethereum';
import {hancockContractNotFoundError, hancockEventError, hancockSubscribeToContractError} from '../../models/error';
import {IEthContractEventBody, IEthereumContractModel} from '../../models/ethereum';
import {CONSUMER_EVENT_KINDS} from '../../models/models';
import { error, onError } from '../../utils/error';
import { generateHancockContractSLbody } from '../../utils/ethereum/utils';
import logger from '../../utils/logger';
import {_getBlock} from './transaction';

export let contractSubscriptionList: any[] = [];

// tslint:disable-next-line:variable-name
export const subscribeContractsController = async (
  socket: WebSocket, uuid: string, contracts: string[], web3I: any, consumer: string) => {

  const consumerInstance: IConsumer = await getConsumer(socket, consumer);

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

function _removeAndUnsubscribe(obj: any, uuid: string, subscriptions: any[], newSubscriptionList: any[]) {

  obj.subscriptions.forEach((sub: any) => {
    if (sub.socketId !== uuid) {
      subscriptions.push(sub);
    }
  });
  if (subscriptions.length !== 0) {
    obj.subscriptions = subscriptions;
    newSubscriptionList.push(obj);
  } else {
    obj.eventEmitterEvents.unsubscribe();
  }

}

// tslint:disable-next-line:variable-name
export const _closeConnectionSocket = async (uuid: string) => {
  const newSubscriptionList: any[] = [];
  contractSubscriptionList.forEach((obj) => {
    const subscriptions: any[] = [];
    _removeAndUnsubscribe(obj, uuid, subscriptions, newSubscriptionList);
  });
  contractSubscriptionList = newSubscriptionList;
};

export const _socketSubscriptionState = (list: any[], address: string, uuid: string) => {
  // tslint:disable-next-line:no-var-keyword
  let response: number = 0;
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
    const subscriptions: any[] = [];
    contracts.forEach((address) => {
      // tslint:disable-next-line:no-var-keyword
      let checked = false;
      if (obj.contractAddress.toUpperCase() === address.toUpperCase()) {
        checked = true;
        _removeAndUnsubscribe(obj, uuid, subscriptions, newSubscriptionList);
      }
      if (!checked) {
        newSubscriptionList.push(obj);
      }
    });
  });

  contractSubscriptionList = newSubscriptionList;
};

export const restartSubscriptionsContracts = (web3Instance: any) => {
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
  let transaction: any = {};
  blockHeader.transactions.forEach((tx: any) => {
    if (tx.hash === eventBody.transactionHash) {
      transaction = tx;
    }
  });
  logger.info(`new event from contract ${eventBody.address} sent to the socket with uuid =>> ${sub.socketId}  `);
  sub.consumerInstance.notify({
    kind: CONSUMER_EVENT_KINDS.SmartContractEvent,
    body: generateHancockContractSLbody(eventBody, (transaction.gas * Number(transaction.gasPrice)).toString(), blockHeader.timestamp),
    raw: eventBody,
    matchedAddress: eventBody.address,
  });
};
