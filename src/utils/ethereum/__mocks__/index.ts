function _getEthMock() {
  return jest.fn().mockImplementation(() => {
    const promise = Promise.resolve('whatever');
    (promise as any).on = jest.fn().mockReturnValue(promise);
    return promise;
  });
}

// tslint:disable-next-line:variable-name
export const __mockWeb3__ = {
  eth: {
    getBlock: _getEthMock(),
    getCode: _getEthMock(),
    sendSignedTransaction: _getEthMock(),
    sendTransaction: _getEthMock(),
    subscribe: _getEthMock(),
    Contract: _getEthMock(),
    net: {
      isListening: jest.fn().mockImplementation(() => {
        return Promise.resolve(true);
      }),
    },
  },
};

export const getWeb3 = jest.fn().mockResolvedValue(__mockWeb3__);

export const initWeb3 = jest.fn();
