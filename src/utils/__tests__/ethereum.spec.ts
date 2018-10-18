import config from '../config';
import * as ethereum from '../ethereum';
// tslint:disable-next-line:no-var-requires
const Web3Lib = require('web3');

jest.mock('../config');
jest.mock('web3');

describe('getWeb3', async () => {

  it('should web3 intialized', async () => {

    ((Web3Lib as any).__web3Instance__.eth.net.isListening as jest.Mock).mockResolvedValue(true);

    const result = await ethereum.getWeb3();

    expect(result).toEqual((Web3Lib as any).__web3Instance__);
  });

  it('should init web3', async () => {

    ((Web3Lib as any).__web3Instance__.eth.net.isListening as jest.Mock).mockReturnValue(false);

    const result = await ethereum.getWeb3();

    expect(result).toEqual((Web3Lib as any).__web3Instance__);
  });
});
