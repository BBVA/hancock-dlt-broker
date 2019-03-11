import 'jest';
import * as url from 'url';
import { __consumerInstance__ } from '../../../domain/consumers/__mocks__/consumer';
import { findOne } from '../../../domain/ethereum';
import {onError} from '../../../utils/error';
import * as Ethereum from '../../../utils/ethereum';
import * as contractController from '../contract';

jest.mock('url');
jest.mock('fs');
jest.mock('path');
jest.mock('../../../utils/config');
jest.mock('../../../domain/consumers/consumerFactory');
jest.mock('../../../domain/consumers/consumer');
jest.mock('../../../utils/ethereum');
jest.mock('../../../utils/logger');
jest.mock('../../../utils/error');
jest.mock('../../../utils/schema');

describe('contractController', () => {

  let socket: any;
  let req: any;
  let example: any;
  let web3: any;
  let newBlock: any;
  let blockBody: any;
  const uuid: string = 'uuid';

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.restoreAllMocks();

    while (contractController.contractSubscriptionList.length > 0) {
      contractController.contractSubscriptionList.pop();
    }

    socket = {
      on: jest.fn(),
      send: jest.fn(),
      terminate: jest.fn(),
    };

    req = {};

    example = {
      body: {},
      consumer: 'Consumer',
      kind: 'watch-contracts',
    };

    web3 = await Ethereum.getWeb3();
    newBlock = {
      hash: '0xf22152edb76673b5f6909e5693f786128760a3761c8a3ccd6b63a3ca45bd053c',
    };

    blockBody = {
      transactions: [
        {
          from: 'from',
          hash: 'hash',
          to: 'to',
        },
      ],
    };

    web3.eth.subscribe = jest.fn().mockImplementation(() => {
      return {
        on: jest.fn().mockImplementationOnce(() => {
          return {
            on: jest.fn().mockImplementationOnce((message, callback) => {
              return callback(newBlock);
            }),
          };
        }),
      };
    });
  });

  describe('_subscribeContractsController', () => {

    const event = {
      id: 1,
      event: 'whatever',
    };

    const contract = {
      address: 'mockedAddress',
      alias: 'mockedAlias',
      abi: [],
    };

    let web3Contract: any;

    (findOne as any) = jest.fn().mockResolvedValueOnce(Promise.resolve(contract));

    beforeEach(() => {

      web3Contract = {
        events: {
          allEvents: jest.fn().mockImplementationOnce((obj) => {
            return {
              on: jest.fn().mockImplementationOnce(() => {
                return {
                  on: jest.fn().mockImplementationOnce((message, callback) => {
                    callback(event);
                  }),
                };
              }),
            };
          }),
        },
        address: 'mockedAddress',
      };

      web3.eth.Contract.mockImplementation(() => web3Contract);

    });

    it('should call _subscribeContractsController and subscribe contract ', async () => {

      let _socketSubscriptionState: any;
      let _addNewContract: any;

      _socketSubscriptionState = jest
        .spyOn((contractController as any), '_socketSubscriptionState')
        .mockImplementationOnce(() => 0);

      _addNewContract = jest
        .spyOn((contractController as any), '_addNewContract')
        .mockImplementationOnce(() => 0);

      (findOne as any) = jest.fn().mockImplementationOnce(() => contract);

      await contractController.subscribeContractsController(socket, uuid, ['from'], web3);

      expect(_socketSubscriptionState).toHaveBeenCalledWith(contractController.contractSubscriptionList, contract.address, uuid);
      expect(_addNewContract).toHaveBeenCalledWith(contract, web3Contract, web3, uuid, socket, __consumerInstance__);

    });

    it('should call _subscribeContractsController and add new subscription ', async () => {

      let _socketSubscriptionState: any;
      let _addNewSubscriptionToContract: any;

      _socketSubscriptionState = jest
        .spyOn((contractController as any), '_socketSubscriptionState')
        .mockImplementationOnce(() => 1);

      _addNewSubscriptionToContract = jest
        .spyOn((contractController as any), '_addNewSubscriptionToContract')
        .mockImplementationOnce(() => 0);

      (findOne as any) = jest.fn().mockImplementationOnce(() => contract);

      await contractController.subscribeContractsController(socket, uuid, ['from'], web3);

      expect(_socketSubscriptionState).toHaveBeenCalledWith(contractController.contractSubscriptionList, web3Contract.address, uuid);
      expect(_addNewSubscriptionToContract).toHaveBeenCalledWith(contract, uuid, socket, __consumerInstance__);

    });

    it('should call _subscribeContractsController and call onError', async () => {

      (findOne as any) = jest.fn().mockImplementationOnce(() => false);

      await contractController.subscribeContractsController(socket, uuid, ['from'], web3);

      expect(onError).toHaveBeenCalled();

    });

    it('should call _subscribeContractsController and call onError', async () => {

      (findOne as any) = jest.fn().mockImplementationOnce(() => {
        throw new Error('Error!');
      });

      await contractController.subscribeContractsController(socket, uuid, ['from'], web3);

      expect(onError).toHaveBeenCalled();

    });

  });

  describe('_closeConnectionSocket', () => {

    const unsubscribe1 = jest.fn();
    const unsubscribe2 = jest.fn();
    const unsubscribe3 = jest.fn();
    const unsubscribe4 = jest.fn();

    beforeEach(() => {

      contractController.contractSubscriptionList.push({
        eventEmitterEvents: {
          unsubscribe: unsubscribe1,
        },
        eventEmitterLogs: {
          unsubscribe: unsubscribe2,
        },
        subscriptions: [{
          socketId: uuid,
        }, {
          socketId: 'randomValue',
        }],
      });

      contractController.contractSubscriptionList.push({
        eventEmitterEvents: {
          unsubscribe: unsubscribe3,
        },
        eventEmitterLogs: {
          unsubscribe: unsubscribe4,
        },
        subscriptions: [{
          socketId: uuid,
        }],
      });
    });

    it('should call _closeConnectionSocket', async () => {

      expect(contractController.contractSubscriptionList.length).toBe(2);

      contractController._closeConnectionSocket(uuid);

      expect(contractController.contractSubscriptionList.length).toBe(1);
      expect(unsubscribe1).not.toHaveBeenCalled();
      expect(unsubscribe2).not.toHaveBeenCalled();
      expect(unsubscribe3).toHaveBeenCalled();
      expect(unsubscribe4).toHaveBeenCalled();
      expect(contractController.contractSubscriptionList[0].subscriptions.length).toBe(1);

    });

  });

  describe('_socketSubscriptionState', () => {

    beforeEach(() => {

      contractController.contractSubscriptionList.push({
        contractAdress: 'address',
        subscriptions: [{
          socketId: 'randomValue',
        }],
      });

      contractController.contractSubscriptionList.push({
        contractAdress: 'address2',
        subscriptions: [{
          socketId: uuid,
        }],
      });
    });

    it('should call _socketSubscriptionState and return 0', async () => {

      const response = contractController._socketSubscriptionState(contractController.contractSubscriptionList, 'address3', uuid);

      expect(response).toBe(0);

    });

    it('should call _socketSubscriptionState and return 1', async () => {

      const response = contractController._socketSubscriptionState(contractController.contractSubscriptionList, 'address', uuid);

      expect(response).toBe(1);

    });

    it('should call _socketSubscriptionState and return 2', async () => {

      const response = contractController._socketSubscriptionState(contractController.contractSubscriptionList, 'address2', uuid);

      expect(response).toBe(2);

    });

  });

  describe('_addNewSubscriptionToContract', () => {

    beforeEach(() => {

      contractController.contractSubscriptionList.push({
        contractAdress: 'mockedAddress',
        subscriptions: [{
          socketId: 'randomValue',
        }],
      });
    });

    it('should call _addNewSubscriptionToContract and add new element', async () => {

      expect(contractController.contractSubscriptionList[0].subscriptions.length).toBe(1);
      const contract = {
        address: 'mockedAddress',
        alias: 'mockedAlias',
        abi: [],
        abiName: 'mockedAbiName',
      };
      contractController._addNewSubscriptionToContract(contract, uuid, socket, __consumerInstance__);

      expect(contractController.contractSubscriptionList[0].subscriptions.length).toBe(2);

    });

    it('should call _addNewSubscriptionToContract and do nothing', async () => {

      expect(contractController.contractSubscriptionList[0].subscriptions.length).toBe(1);
      const contract = {
        address: 'randomValue',
        alias: 'mockedAlias',
        abi: [],
        abiName: 'mockedAbiName',
      };
      contractController._addNewSubscriptionToContract(contract, uuid, socket, __consumerInstance__);

      expect(contractController.contractSubscriptionList[0].subscriptions.length).toBe(1);

    });

  });

  describe('_addNewContract', () => {

    it('should call _addNewContract and add new element', async () => {

      expect(contractController.contractSubscriptionList.length).toBe(0);

      const contract = {
        address: 'mockedAddress',
        alias: 'mockedAlias',
        abi: [],
        abiName: 'mockedAbiName',
      };
      const web3Contract = {
        events: {
          allEvents: jest.fn().mockImplementation(() => {
            return {
              on: jest.fn().mockImplementationOnce(() => {
                return {
                  on: jest.fn().mockImplementationOnce((message, callback) => {
                    return callback(newBlock);
                  }),
                };
              }),
            };
          }),
        },
      };
      contractController._addNewContract(contract, web3Contract, web3, uuid, socket, __consumerInstance__);

      expect(contractController.contractSubscriptionList.length).toBe(1);
      expect(contractController.contractSubscriptionList[0].subscriptions.length).toBe(1);
      expect(contractController.contractSubscriptionList[0].contractAdress).toBe(contract.address);
      expect(contractController.contractSubscriptionList[0].subscriptions[0].socketId).toBe(uuid);
      expect(contractController.contractSubscriptionList[0].subscriptions[0].socket).toBe(socket);
      expect(contractController.contractSubscriptionList[0].subscriptions[0].consumerInstance).toBe(__consumerInstance__);

    });

  });

  describe('unsubscribeContractsController', () => {

    const unsubscribe1 = jest.fn();
    const unsubscribe2 = jest.fn();
    const unsubscribe3 = jest.fn();
    const unsubscribe4 = jest.fn();

    beforeEach(() => {

      contractController.contractSubscriptionList.push({
        contractAddress: 'address',
        eventEmitterEvents: {
          unsubscribe: unsubscribe1,
        },
        eventEmitterLogs: {
          unsubscribe: unsubscribe2,
        },
        subscriptions: [{
          socketId: uuid,
        }, {
          socketId: 'randomValue',
        }],
      });

      contractController.contractSubscriptionList.push({
        contractAddress: 'address2',
        eventEmitterEvents: {
          unsubscribe: unsubscribe3,
        },
        eventEmitterLogs: {
          unsubscribe: unsubscribe4,
        },
        subscriptions: [{
          socketId: uuid,
        }],
      });
    });

    it('should call unsubscribeContractsController', async () => {

      expect(contractController.contractSubscriptionList.length).toBe(2);

      contractController.unsubscribeContractsController(uuid, ['address2']);

      expect(contractController.contractSubscriptionList.length).toBe(1);
      expect(unsubscribe1).not.toHaveBeenCalled();
      expect(unsubscribe2).not.toHaveBeenCalled();
      expect(unsubscribe3).toHaveBeenCalled();
      expect(unsubscribe4).toHaveBeenCalled();
      expect(contractController.contractSubscriptionList[0].subscriptions.length).toBe(2);

    });

  });

});
