import config from '../config';
import {BitcoinApiService} from './services/api';
import {BitcoinSocketService} from './services/socket';

// API
// https://github.com/ruimarinho/bitcoin-core/blob/HEAD/src/methods.js
// https://github.com/bitpay/insight-api

let bitcoinInstance: BitcoinClient;

export class BitcoinClient {
  constructor(public socket: BitcoinSocketService, public api: BitcoinApiService) {
  }
}

function initBitcoinClient() {

  const cfg: any = config.blockchain.bitcoin;

  bitcoinInstance = new BitcoinClient(new BitcoinSocketService(cfg.socketUrl), new BitcoinApiService(cfg.apiUrl));

}

export async function getBitcoinClient(): Promise<BitcoinClient> {

  let connReady: boolean;

  try {

    // connReady = !!bitcoinInstance && await bitcoinInstance.node.getBlockchainInfo() && await bitcoinInstance.api.getInfo();
    connReady = !!bitcoinInstance;

  } catch (e) {

    connReady = false;

  }

  if (!connReady) {
    initBitcoinClient();
  }

  return bitcoinInstance;

}
