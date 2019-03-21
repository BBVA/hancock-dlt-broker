import { _restartSubscriptionsContracts } from '../../controllers/ethereum/contract';
import { _restartSubscriptionsTransactions } from '../../controllers/ethereum/transaction';
import config from '../config';
import logger from '../logger';

// tslint:disable-next-line:no-var-requires
const web3 = require('web3');

let web3Instance: any;

function initWeb3() {

  web3Instance = new web3(getProvider(false));

}

export function getProvider(restartSubscriptions: boolean = true) {
  const cfg: any = config.blockchain.ethereum;
  logger.info('Socket URL', `${cfg.protocol}://${cfg.url}`);
  const provider = new web3.providers.WebsocketProvider(`${cfg.protocol}://${cfg.url}`);

  provider.on('end', (err: any) => {
    logger.error('WS End', err);
    logger.info('Trying to reconnect');
    setTimeout(getProvider, 60 * 1000);
  });

  if (restartSubscriptions) {
    provider.on('connect', () => {
      web3Instance.setProvider(provider);
      _restartSubscriptionsContracts();
      _restartSubscriptionsTransactions(web3Instance);
    });
  }

  logger.info('provider', provider);

  return provider;
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
