
import * as WebSocket from 'ws';
import { IConsumer } from '../../domain/consumers/consumer';
import { getConsumer } from '../../domain/consumers/consumerFactory';
import { CONSUMERS } from '../../domain/consumers/types';
import * as domain from '../../domain/ethereum';
import {
  hancockContractNotFoundError,
  hancockEventError,
  hancockLogsError,
  hancockSubscribeToContractError,
} from '../../models/error';
import {
  IEthContractEventBody,
  IEthContractLogBody,
  IEthereumContractModel,
} from '../../models/ethereum';
import { error, onError } from '../../utils/error';
import logger from '../../utils/logger';

// tslint:disable-next-line:variable-name
export const _subscribeContractsController = async (
  socket: WebSocket, contracts: string[], web3I: any, subscriptions: any[], subscriptionsContractsAddress: any[], consumer: CONSUMERS = CONSUMERS.Default) => {

  const consumerInstance: IConsumer = getConsumer(socket, consumer);

  contracts.forEach(async (contractAddressOrAlias: string) => {

    try {

      const ethContractModel: IEthereumContractModel | null = await domain.findOne(contractAddressOrAlias);

      if (ethContractModel && subscriptions.indexOf(ethContractModel.address) === -1) {

        subscriptionsContractsAddress.push(ethContractModel.address);
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
