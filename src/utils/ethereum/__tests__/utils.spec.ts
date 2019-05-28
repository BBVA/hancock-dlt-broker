import 'jest';
import { CURRENCY } from '../../../models/models';
import * as utilsUtils from '../utils';

describe('utilsUtils', () => {

  describe('::getScQueryByAddressOrAlias', () => {

    it('should return the mongo query to find contracModels by alias', () => {

      const alias: string = 'mockedAddressOrAlias';
      const result: {} = utilsUtils.getScQueryByAddressOrAlias(alias);

      expect(result).toEqual({ alias });

    });

    it('should return the mongo query to find contracModels by address', () => {

      const fortyHexChars: string = Array.from({ length: 40 }, (i) => Math.floor(Math.random() * 10)).join('');
      const address: string = `0x${fortyHexChars}`;

      const result: {} = utilsUtils.getScQueryByAddressOrAlias(address);

      expect(result).toEqual({ address });

    });

  });

  describe('_generateHancockSLbody', () => {

    const timestamp = 100;

    it('should call _restartSubscriptionsTransactions correctly', async () => {

      const blockBody: any = {
        transactions: [
          {
            from: 'from',
            hash: 'hash',
            to: 'to',
            gas: 21000,
            gasPrice: 100000000,
            value: 1000,
            input: '0x174837292',
            blockNumber: 1,
            blockHash: 'blockHash',
          },
        ],
        timestamp: 12342345234,
      };

      const reponse = utilsUtils.generateHancockTransactionHSLBody(blockBody.transactions[0], timestamp);

      expect(reponse).toEqual({
        blockHash: blockBody.transactions[0].blockHash,
        blockNumber: blockBody.transactions[0].blockNumber,
        transactionId: blockBody.transactions[0].hash,
        from: blockBody.transactions[0].from,
        to: blockBody.transactions[0].to,
        value: {
          amount: blockBody.transactions[0].value,
          decimals: 18,
          currency: CURRENCY.Ethereum,
        },
        data: blockBody.transactions[0].input,
        fee: {
          amount: (blockBody.transactions[0].gas * Number(blockBody.transactions[0].gasPrice)).toString(),
          decimals: 18,
          currency: CURRENCY.Ethereum,
        },
        timestamp,
      });

    });

  });

});
