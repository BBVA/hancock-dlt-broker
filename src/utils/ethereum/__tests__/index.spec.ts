import 'jest';
import * as ethereum from '../';
import config from '../../config';
// tslint:disable-next-line:no-var-requires
const web3Lib = require('web3');

jest.mock('../../config');
jest.mock('../../logger');
jest.mock('web3');

describe('getWeb3', async () => {

  it('should web3 intialized', async () => {

    ((web3Lib as any).__web3Instance__.eth.net.isListening as jest.Mock).mockResolvedValue(true);

    const result = await ethereum.getWeb3();

    expect(result).toEqual((web3Lib as any).__web3Instance__);
  });

  it('should init web3', async () => {

    ((web3Lib as any).__web3Instance__.eth.net.isListening as jest.Mock).mockReturnValue(false);

    const result = await ethereum.getWeb3();

    expect(result).toEqual((web3Lib as any).__web3Instance__);
  });
});

describe('getProvider', async () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should web3 intialized', async () => {

    const result = await ethereum.getProvider(false);

    expect(result.on).toHaveBeenCalledTimes(1);
    expect(result).toEqual((web3Lib as any).providers.WebsocketProvider());
  });

  it('should init web3', async () => {

    const result = await ethereum.getProvider(true);

    expect(result.on).toHaveBeenCalledTimes(2);
    expect(result).toEqual((web3Lib as any).providers.WebsocketProvider());
  });
});
