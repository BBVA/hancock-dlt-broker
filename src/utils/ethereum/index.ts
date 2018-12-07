import config from '../config';

// tslint:disable-next-line:no-var-requires
const web3 = require('web3');

let web3Instance: any;

function initWeb3() {

  const cfg: any = config.blockchain.ethereum;
  web3Instance = new web3(new web3.providers.WebsocketProvider(`${cfg.protocol}://${cfg.url}`));

}

export async function getWeb3() {

  let connReady: boolean;

  try {

    connReady = !!web3Instance && await web3Instance.eth.net.isListening();

  } catch (e) {

    connReady = false;

  }

  if (!connReady) {
    initWeb3();
  }

  return web3Instance;

}
