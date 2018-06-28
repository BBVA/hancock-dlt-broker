import 'jest';
import { Collection } from 'mongodb';
import { IEthereumContractModel } from '../../models/ethereum';
import * as db from '../../utils/db';
import { getScQueryByAddressOrAlias } from '../../utils/utils';
import * as ethereumDomain from '../ethereum';

jest.mock('../../utils/config');
jest.mock('../../utils/utils');
jest.mock('../../utils/db');

describe('ethereumDomain', async () => {

  const collMock = ((db as any).__collection__);

  beforeEach(() => {

    jest.clearAllMocks();

  });

  it('::_getCollection should return the mongodb collection successfully', async () => {

    const getDbMock = (db.getDb as jest.Mock);
    const dbClientMock = ((db as any).__client__);

    const coll: Collection = await ethereumDomain._getCollection();

    expect(getDbMock).toHaveBeenCalledWith('mockDatabase');
    expect(dbClientMock.collection).toHaveBeenCalledWith('mockDatabaseCollectionContracts');
    expect(coll).toBe(collMock);

  });

  describe('::subscribe', () => {

    it('should call SocketSubscribeController correctly', async () => {

      const addressOrAlias: string = 'mockedAddressOrAlias';
      const contractModelResponse: IEthereumContractModel = {} as any;
      const queryResponse = {};

      (getScQueryByAddressOrAlias as jest.Mock).mockReturnValue(queryResponse);
      jest.spyOn(ethereumDomain, '_getCollection').mockResolvedValue(collMock);
      (collMock.findOne as jest.Mock).mockResolvedValue(contractModelResponse);

      const result = await ethereumDomain.subscribe(addressOrAlias);

      expect(getScQueryByAddressOrAlias).toHaveBeenCalledWith(addressOrAlias);
      expect(collMock.findOne).toHaveBeenCalledWith(queryResponse);
      expect(result).toEqual(contractModelResponse);

    });

  });

});
