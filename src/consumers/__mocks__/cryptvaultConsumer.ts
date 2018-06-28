// tslint:disable-next-line:variable-name
export const __consumerCryptVaultInstance__ = {
    cypherAndSendTransfer: jest.fn().mockReturnThis(),
    getToken: jest.fn().mockReturnThis(),
    getTxDirection: jest.fn().mockReturnThis(),
    notify: jest.fn().mockReturnThis(),
  };

// tslint:disable-next-line:variable-name
export const CryptvaultConsumer = jest.fn().mockImplementation(() => __consumerCryptVaultInstance__);
