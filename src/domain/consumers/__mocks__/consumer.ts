// tslint:disable-next-line:variable-name
export const __consumerInstance__ = {
    getReceiverFromRawTx: jest.fn().mockReturnThis(),
    getSenderFromRawTx: jest.fn().mockReturnThis(),
    notify: jest.fn().mockReturnThis(),
  };

// tslint:disable-next-line:variable-name
export const Consumer = jest.fn().mockImplementation(() => __consumerInstance__);
