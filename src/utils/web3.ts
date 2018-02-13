import { Express } from 'express';
import * as WebSocket from 'ws';
import config from './config';

// tslint:disable-next-line:no-var-requires
const Web3 = require('web3');

let web3: any;

function initWeb3() {

  const cfg: any = config.blockchain.eth;
  web3 = new Web3(new Web3.providers.WebsocketProvider(`ws://${cfg.host}:${cfg.port}`));

}

export async function getWeb3() {

  const connReady: boolean = web3 && await web3.eth.isListening();

  if (!connReady) {
    initWeb3();
  }

  return web3;

}
