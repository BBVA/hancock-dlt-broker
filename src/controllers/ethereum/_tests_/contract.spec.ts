import 'jest';
import * as url from 'url';
import { __consumerInstance__ } from '../../../domain/consumers/__mocks__/consumer';
import { findOne } from '../../../domain/ethereum';
import {
  hancockGetBlockError,
  hancockGetCodeError,
  hancockSubscribeToTransferError,
} from '../../../models/error';
import {error, onError} from '../../../utils/error';
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

describe('subscribers', () => {

  let socket: any;
  let req: any;
  let example: any;
  let web3: any;
  let newBlock: any;
  let blockBody: any;
  const uuid: string = 'uuid';

  beforeEach(async () => {
    jest.clearAllMocks();

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
      };

      web3.eth.Contract.mockImplementation(() => web3Contract);

    });

    it('should call _subscribeContractsController and call onError', async () => {

      (findOne as any) = jest.fn().mockImplementationOnce(() => {
        throw new Error('Error!');
      });

      await contractController._subscribeContractsController(socket, uuid, ['from'], web3);

      expect(onError).toHaveBeenCalled();

    });

  });

});
