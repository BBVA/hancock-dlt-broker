import { NextFunction, Request, Response, Router } from 'express';
import * as http from 'http';
import * as url from 'url';
import * as WebSocket from 'ws';
import * as domain from '../domain/ethereum';
import {
  IEthContractEventBody,
  IEthContractLogBody,
  IEthereumContractModel,
  IEthTransactionBody,
} from '../models/ethereum';
import {ISocketMessage} from '../models/models';
import * as Web3 from '../utils/web3';
import {SocketError} from './error';

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

export async function SocketSubscribeController(socket: WebSocket, req: http.IncomingMessage) {

  const { query } = url.parse(req.url as string, true);

  const addressOrAlias: string = (query.address || query.alias) as string;
  const sender: string = query.sender as string;

  console.log('Incoming socket connection => ', addressOrAlias || sender);

  const subscriptions: any[] = [];
  const web3I = await Web3.getWeb3();

  socket.on('close', () => {

    console.log('unsubscribing...');

    subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });

  });

  socket.on('message', (data: any) => {
    const dataObj:ISocketMessage = JSON.parse(data);
    if(dataObj.kind === 'watch-addresses'){
      SubscribeTransferController(socket, dataObj.body, web3I, subscriptions);
    } else if(dataObj.kind === 'watch-contracts'){
      SubscribeContractsController(socket, dataObj.body, web3I, subscriptions)
    }
  });

  if(addressOrAlias){
    SubscribeContractsController(socket, [addressOrAlias], web3I, subscriptions);
  } else if(sender){
    SubscribeTransferController(socket, [sender], web3I, subscriptions)
  }

  // Check if there is at least one subscription
  if (subscriptions.length === 0) {
    onError(socket, 'No subscriptions', true);
  }

}

export async function SubscribeContractsController(socket: WebSocket, contracts: string[], web3I: any, subscriptions: any[]){
  contracts.map(async contract => {

    try {
      
      const ethContractModel: IEthereumContractModel = await domain.subscribe(contract);

      if (ethContractModel) {

        const contract = new web3I.eth.Contract(ethContractModel.abi, ethContractModel.address);

        // Subscribe to contract events
        console.info('Subscribing to contract events...');
        subscriptions.push(
          contract.events
            .allEvents({
              address: ethContractModel.address,
            })
            .on('error', (error: Error) => onError(socket, error.message))
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
            .on('error', (error: Error) => onError(socket, error.message))
            .on('data', (logBody: IEthContractLogBody) => {

              console.log(`new log from contract ${ethContractModel.alias} =>> ${logBody.id}`);
              socket.send(JSON.stringify({ kind: 'log', body: logBody }));

            }),
        );

      } else {
        onError(socket, 'Contract not found');
      }

    } catch (error) {

      onError(socket, error.message);

    }
  })
}

export async function SubscribeTransferController(socket: WebSocket, addresses: string[], web3I: any, subscriptions: any[]){

  try{

    addresses.map(address => {
      // Subscribe to pending transactions
      console.info('Subscribing to pending transactions...');
      subscriptions.push(
        web3I.eth
          .subscribe('pendingTransactions')
          .on('error', (error: Error) => onError(socket, error.message))
          .on('data', (txHash: any) => {
  
            web3I.eth
              .getTransaction(txHash)
              .then((txBody: IEthTransactionBody) => {
  
                if (txBody.from.toUpperCase() === address.toUpperCase() || txBody.to.toUpperCase() === address.toUpperCase()) {
  
                  console.log(`new tx =>> ${txHash}, from: ${txBody.from}`);
                  socket.send(JSON.stringify({ kind: 'tx', body: txBody }));
  
                }
  
              });
  
          }),
      );
    })

  } catch(error) {

    onError(socket, error.message);

  }
  
  
}

function onError(socket: WebSocket, message: string, terminate: boolean = false) {
  const socketError: SocketError = new SocketError(message);
  socket.send(JSON.stringify({ kind: 'error', body: socketError }));

  if (terminate) {
    socket.terminate();
  }
}
