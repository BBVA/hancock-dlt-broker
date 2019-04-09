// tslint:disable-next-line:variable-name
export const __consumerSecureInstance__ = {
  cypherAndSendTransfer: jest.fn().mockReturnThis(),
  getToken: jest.fn().mockReturnThis(),
  getTxDirection: jest.fn().mockReturnThis(),
  notify: jest.fn().mockReturnThis(),
};

// tslint:disable-next-line:variable-name
export const SecureConsumer = jest.fn().mockImplementation(() => __consumerSecureInstance__);
