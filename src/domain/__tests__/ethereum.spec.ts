import 'jest';
import * as db from '../../db/ethereum';
import {hancockDbError} from '../../models/error';
import {IEthereumContractModel} from '../../models/ethereum';
import * as ethereumDomain from '../ethereum';

jest.mock('../../db/ethereum');
jest.mock('../../utils/error');

describe('ethereumDomain', async () => {

  beforeEach(() => {

    jest.clearAllMocks();

  });

  describe('::findOne', () => {

    it('should call db.getSmartContractByAddressOrAlias and retrieve the ContractModel', async () => {

      const addressOrAlias: string = 'mockedAddressOrAlias';
      const contractModelResponse: IEthereumContractModel = {} as any;

      const dbMock = (db.getSmartContractByAddressOrAlias as jest.Mock).mockResolvedValue(contractModelResponse);

      const result: IEthereumContractModel | null = await ethereumDomain.findOne(addressOrAlias);

      expect(dbMock).toHaveBeenCalledWith(addressOrAlias);
      expect(result).toEqual(contractModelResponse);

    });

    it('should call db.getSmartContractByAddressOrAlias and throw error', async () => {

      const addressOrAlias: string = 'mockedAddressOrAlias';

      try {

        await ethereumDomain.findOne(addressOrAlias);

      } catch (err) {

        expect(err).toEqual(hancockDbError);

      }

    });

  });

});
