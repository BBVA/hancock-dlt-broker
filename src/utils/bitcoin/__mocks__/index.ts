// tslint:disable-next-line:variable-name
export const __mockBitcoinClient__ = {
  socket: {
    subscribeToNewBLocks: jest.fn().mockImplementation(() => {
      const promise = Promise.resolve('whatever');
      (promise as any).on = jest.fn().mockReturnValue(promise);
      return promise;
    }),
  },
  api: {
    getBlock: jest.fn().mockImplementation(() => {
      return Promise.resolve('whatever');
    }),
  },
};

export const getBitcoinClient = jest.fn().mockResolvedValue(__mockBitcoinClient__);
