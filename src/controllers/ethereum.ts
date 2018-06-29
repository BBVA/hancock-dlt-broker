import { NextFunction, Request, Response, Router } from 'express';
import * as http from 'http';
import * as url from 'url';
import * as WebSocket from 'ws';
import { IConsumer } from '../consumers/consumer';
import { getConsumer } from '../consumers/consumerFactory';
import { CONSUMERS } from '../consumers/types';
import * as domain from '../domain/ethereum';
import {
  IEthBlockBody,
  IEthBlockHeader,
  IEthContractEventBody,
  IEthContractLogBody,
  IEthereumContractModel,
  IEthTransactionBody,
} from '../models/ethereum';
import { ISocketMessage } from '../models/models';
import * as Ethereum from '../utils/ethereum';
import { SocketError } from './error';

export function SubscribeController(req: Request, res: Response, next: NextFunction) {

  const addressorAlias: string = req.query.address || req.query.alias;
  // const sender: string = req.query.sender;

  if (!addressorAlias) {
    throw new Error('DEFAULT_ERROR');
  }

  domain
    .subscribe(addressorAlias)
    .then((response: any) => res.send(response))
    .catch(next);

}

// tslint:disable-next-line:variable-name
export async function SocketSubscribeController(socket: WebSocket, req: http.IncomingMessage) {

  const { query } = url.parse(req.url as string, true);

  const addressOrAlias: string = (query.address || query.alias) as string;
  const sender: string = query.sender as string;
  const consumer: CONSUMERS = query.consumer as CONSUMERS;

  console.log('Incoming socket connection => ', consumer, addressOrAlias || sender);

  const subscriptions: any[] = [];
  const web3I = await Ethereum.getWeb3();

  socket.on('close', () => {

    console.log('unsubscribing...');

    subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });

  });

  socket.on('message', (data: any) => {

    const dataObj: ISocketMessage = JSON.parse(data);

    console.log('Incoming message => ', dataObj);

    switch (dataObj.kind) {
      case 'watch-addresses':
        _subscribeTransferController(socket, dataObj.body, web3I, subscriptions, dataObj.consumer);
        break;
      case 'watch-contracts':
        _subscribeContractsController(socket, dataObj.body, web3I, subscriptions, dataObj.consumer);
        break;
    }

  });

  if (addressOrAlias) {

    _subscribeContractsController(socket, [addressOrAlias], web3I, subscriptions, consumer);

  } else if (sender) {

    _subscribeTransferController(socket, [sender], web3I, subscriptions, consumer);

  }

  socket.send(JSON.stringify({kind: 'ready'}));

  // Check if there is at least one subscription
  // if (subscriptions.length === 0) {
  //   onError(socket, 'No subscriptions', true);
  // }

}

// tslint:disable-next-line:variable-name
export const _subscribeContractsController = async (
  socket: WebSocket, contracts: string[], web3I: any, subscriptions: any[], consumer: CONSUMERS = CONSUMERS.Default) => {

  const consumerInstance: IConsumer = getConsumer(socket, consumer);

  contracts.map(async (contractAddressOrAlias: string) => {

    try {

      const ethContractModel: IEthereumContractModel | null = await domain.subscribe(contractAddressOrAlias);

      if (ethContractModel) {

        const web3Contract: any = new web3I.eth.Contract(ethContractModel.abi, ethContractModel.address);

        // Subscribe to contract events
        console.info('Subscribing to contract events...');
        subscriptions.push(
          web3Contract.events
            .allEvents({
              address: ethContractModel.address,
            })
            .on('error', (error: Error) => onError(socket, error.message, false, consumerInstance))
            .on('data', (eventBody: IEthContractEventBody) => {

              // tslint:disable-next-line:max-line-length
              console.log(`new event from contract ${ethContractModel.alias} =>> ${eventBody.id} (${eventBody.event}) `);
              // socket.send(JSON.stringify({ kind: 'event', body: eventBody }));
              consumerInstance.notify({ kind: 'event', body: eventBody, matchedAddress: ethContractModel.address });

            }),
        );

        // Subscribe to contract logs (Events)
        console.info('Subscribing to contract logs...');
        subscriptions.push(
          web3I.eth
            .subscribe('logs', {
              address: ethContractModel.address,
            })
            .on('error', (error: Error) => onError(socket, error.message, false, consumerInstance))
            .on('data', (logBody: IEthContractLogBody) => {

              console.log(`new log from contract ${ethContractModel.alias} =>> ${logBody.id}`);
              // socket.send(JSON.stringify({ kind: 'log', body: logBody }));
              consumerInstance.notify({ kind: 'log', body: logBody, matchedAddress: ethContractModel.address });

            }),
        );

      } else {
        onError(socket, 'Contract not found', false, consumerInstance);
      }

    } catch (error) {

      onError(socket, error.message, false, consumerInstance);

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
      console.info('Subscribing to mined transactions...');

      subscriptions.push(
        web3I.eth
          .subscribe('newBlockHeaders')
          .on('error', (error: Error) => onError(socket, error.message, false, consumerInstance))
          .on('data', (blockMined: IEthBlockHeader) => {

            web3I.eth
              .getBlock(blockMined.hash, true)
              .then((blockBody: IEthBlockBody) => {

                blockBody.transactions.map((txBody: IEthTransactionBody) => {

                  if (txBody.from.toUpperCase() === address.toUpperCase()) {

                    web3I.eth.getCode(txBody.to)
                    .then((code: string) => {
                      if (code === '0x0') {
                        console.log(`new tx =>> ${txBody.hash}, from: ${txBody.from}`);
                        // socket.send(JSON.stringify({ kind: 'tx', body: txBody }));
                        consumerInstance.notify({ kind: 'tx', body: txBody, matchedAddress: txBody.from });
                      }
                    });

                  }

                  if (txBody.to.toUpperCase() === address.toUpperCase()) {

                    console.log(`new tx =>> ${txBody.hash}, from: ${txBody.from}`);
                    // socket.send(JSON.stringify({ kind: 'tx', body: txBody }));
                    consumerInstance.notify({ kind: 'tx', body: txBody, matchedAddress: txBody.to });

                  }
                });
              });

          }),
      );
    });

  } catch (error) {

    onError(socket, error.message, false, consumerInstance);

  }

};

function onError(socket: WebSocket, message: string, terminate: boolean = false, consumer?: IConsumer) {

  console.log(`onError => ${message}`);
  const socketError: SocketError = new SocketError(message);

  if (consumer) {
    consumer.notify({ kind: 'error', body: socketError });
  } else {
    socket.send(JSON.stringify({ kind: 'error', body: socketError }));
  }

  if (terminate) {
    socket.terminate();
  }
}
