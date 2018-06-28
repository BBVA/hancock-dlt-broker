// tslint:disable-next-line:variable-name
export const __mockWeb3__ = {
    eth: {
        sendSignedTransaction: jest.fn().mockImplementation(() => {
            const promise = Promise.resolve('whatever');
            (promise as any).on = jest.fn().mockReturnValue(promise);
            return promise;
        }),
        sendTransaction: jest.fn().mockImplementation(() => {
            const promise = Promise.resolve('whatever');
            (promise as any).on = jest.fn().mockReturnValue(promise);
            return promise;
        }),
    },
  };

export const getWeb3 = jest.fn().mockResolvedValue(__mockWeb3__);

export const initWeb3 = jest.fn();
