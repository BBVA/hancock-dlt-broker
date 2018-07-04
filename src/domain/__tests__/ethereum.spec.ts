import 'jest';
import * as db from '../../db/ethereum';
import { IEthereumContractModel } from '../../models/ethereum';
import * as ethereumDomain from '../ethereum';

jest.mock('../../db/ethereum');

describe('ethereumDomain', async () => {

  const collMock = ((db as any).__collection__);

  beforeEach(() => {

    jest.clearAllMocks();

  });

  describe('::findOne', () => {

    it('should call db.getSmartContractByAddressOrAlias and retrieve the ContractModel', async () => {

      const addressOrAlias: string = 'mockedAddressOrAlias';
      const contractModelResponse: IEthereumContractModel = {} as any;

      const dbMock = (db.getSmartContractByAddressOrAlias as jest.Mock).mockResolvedValue(contractModelResponse);

      const result: IEthereumContractModel = await ethereumDomain.findOne(addressOrAlias);

      expect(dbMock).toHaveBeenCalledWith(addressOrAlias);
      expect(result).toEqual(contractModelResponse);

    });

  });

});
