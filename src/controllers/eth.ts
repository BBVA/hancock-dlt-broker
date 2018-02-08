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

// tslint:disable-next-line:no-var-requires
const Web3 = require('web3');

export function SubscribeController(req: Request, res: Response, next: NextFunction) {

  const address: string = req.query.address;
  const sender: string = req.query.sender;

  console.log(address, sender);

  if (!address || !sender) {
    throw new Error('DEFAULT_ERROR');
  }

  domain
    .subscribe(address, sender)
    .then((response: any) => res.send(response))
    .catch(next);

}

export function SocketSubscribeController(socket: WebSocket, req: http.IncomingMessage) {

  const { query } = url.parse(req.url as string, true);

  const address: string = query.address as string;
  const sender: string = query.sender as string;

  console.log('Incoming socket connection => ', address, sender);

  let web3: any;
  let logsSubscription: any;
  let eventsSubscription: any;
  let txSubscription: any;

  socket.on('close', () => {

    console.log('closing...');

    if (web3) {

      console.log('unsubscribing...');
      logsSubscription.unsubscribe();
      eventsSubscription.unsubscribe();
      txSubscription.unsubscribe();
      web3 = undefined;

    }

    socket.terminate();

  });

  if (!address || !sender) {
    onError(socket);
  }

  domain
    .subscribe(address, sender)
    .then((ethContractModel: IEthereumContractModel) => {

      if (!ethContractModel) {

        onError(socket);

      } else {

        console.log('connection accepted');

        const cfg: any = config.blockchain.eth;
        web3 = new Web3(new Web3.providers.WebsocketProvider(`ws://${cfg.host}:${cfg.port}`));
        const contract = new web3.eth.Contract(ethContractModel.abi, ethContractModel.address);

        // List all avalible accounts in the net (debug)
        if (config.env === 'development') {

          web3.eth
            .getAccounts()
            .then((accounts: any) => {

              console.log('accounts => \n', accounts);

            });

        }

        // Subscribe to contract events
        eventsSubscription = contract.events
          .allEvents({
            address: ethContractModel.address,
          })
          .on('error', console.error)
          .on('data', (eventBody: IEthContractEventBody) => {

            console.log(`new event from contract ${ethContractModel.alias} =>> ${eventBody.id} (${eventBody.event}) `);
            socket.send(JSON.stringify({ kind: 'event', body: eventBody }));

          });

        // Subscribe to contract logs (Events)
        logsSubscription = web3.eth
          .subscribe('logs', {
            address: ethContractModel.address,
          })
          .on('error', console.error)
          .on('data', (logBody: IEthContractLogBody) => {

            console.log(`new log from contract ${ethContractModel.alias} =>> ${logBody.id}`);
            socket.send(JSON.stringify({ kind: 'log', body: logBody }));

          });

        // Subscribe to pending transactions
        txSubscription = web3.eth
          .subscribe('pendingTransactions')
          .on('error', console.error)
          .on('data', (txHash: any) => {

            web3.eth
              .getTransaction(txHash)
              .then((txBody: IEthTransactionBody) => {

                if (!sender || txBody.from.toUpperCase() === sender.toUpperCase()) {

                  console.log(`new tx =>> ${txHash}, from: ${txBody.from}`);
                  socket.send(JSON.stringify({ kind: 'tx', body: txBody }));

                }

              });
          });

      }

    })
    .catch((error: any) => onError(socket, error));

}

function onError(socket: WebSocket, error: any = new Error('DEFAULT_ERROR')) {
  socket.send(JSON.stringify({ kind: 'error', error }));
  socket.terminate();
}
