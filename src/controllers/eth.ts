import { NextFunction, Request, Response, Router } from 'express';
import * as http from 'http';
import * as url from 'url';
import * as WebSocket from 'ws';
import * as domain from '../domain/eth';
import {
  IEthContractEventBody,
  IEthContractLogBody,
  IEthereumContractModel,
  IEthTransactionBody,
} from '../models/eth';
import config from '../utils/config';
import * as Web3 from '../utils/web3';

export function SubscribeController(req: Request, res: Response, next: NextFunction) {

  const address: string = req.query.address;
  // const sender: string = req.query.sender;

  if (!address) {
    throw new Error('DEFAULT_ERROR');
  }

  domain
    .subscribe(address)
    .then((response: any) => res.send(response))
    .catch(next);

}

export async function SocketSubscribeController(socket: WebSocket, req: http.IncomingMessage) {

  const { query } = url.parse(req.url as string, true);

  const address: string = query.address as string;
  const sender: string = query.sender as string;

  console.log('Incoming socket connection => ', address, sender);

  if (!address && !sender) {
    onError(socket);
    return;
  }

  const web3I = Web3.getWeb3();
  const subscriptions: any[] = [];

  socket.on('close', () => {

    console.log('unsubscribing...');

    subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });

  });

  if (address) {

    try {

      const ethContractModel: IEthereumContractModel = await domain.subscribe(address);

      if (ethContractModel) {

        const contract = new web3I.eth.Contract(ethContractModel.abi, ethContractModel.address);

        // Subscribe to contract events
        console.info('Subscribing to contract events...');
        subscriptions.push(
          contract.events
            .allEvents({
              address: ethContractModel.address,
            })
            .on('error', console.error)
            .on('data', (eventBody: IEthContractEventBody) => {

              // tslint:disable-next-line:max-line-length
              console.log(`new event from contract ${ethContractModel.alias} =>> ${eventBody.id} (${eventBody.event}) `);
              socket.send(JSON.stringify({ kind: 'event', body: eventBody }));

            }),
        );

        // Subscribe to contract logs (Events)
        console.info('Subscribing to contract logs...');
        subscriptions.push(
          web3I.eth
            .subscribe('logs', {
              address: ethContractModel.address,
            })
            .on('error', console.error)
            .on('data', (logBody: IEthContractLogBody) => {

              console.log(`new log from contract ${ethContractModel.alias} =>> ${logBody.id}`);
              socket.send(JSON.stringify({ kind: 'log', body: logBody }));

            }),
        );

      }

    } catch (error) {

      onError(socket, error);

    }

  }

  if (sender) {

    // Subscribe to pending transactions
    console.info('Subscribing to pending transactions...');
    subscriptions.push(
      web3I.eth
        .subscribe('pendingTransactions')
        .on('error', console.error)
        .on('data', (txHash: any) => {

          web3I.eth
            .getTransaction(txHash)
            .then((txBody: IEthTransactionBody) => {

              if (txBody.from.toUpperCase() === sender.toUpperCase()) {

                console.log(`new tx =>> ${txHash}, from: ${txBody.from}`);
                socket.send(JSON.stringify({ kind: 'tx', body: txBody }));

              }

            });

        }),
    );

  }

  // Check if there is at least one subscription
  if (subscriptions.length === 0) {
    onError(socket, 'No subscriptions');
  }

}

function onError(socket: WebSocket, error: any = new Error('DEFAULT_ERROR')) {
  socket.send(JSON.stringify({ kind: 'error', error }));
  socket.terminate();
}
