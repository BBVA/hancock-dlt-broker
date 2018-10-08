import 'jest';
import { AggregationCursor, Collection } from 'mongodb';
import * as db from '../../utils/db';
import * as utils from '../../utils/ethereum/utils';
import * as ethereumDb from '../ethereum';

jest.mock('../../utils/config');
jest.mock('../../utils/db');
jest.mock('../../utils/ethereum/utils');
jest.mock('../../utils/logger');
jest.mock('mongodb');

describe('dbEthereum', async () => {

  it('::_getCollection should return the mongodb collection successfully', async () => {

    const getDbMock = (db.getDb as jest.Mock);
    const dbClientMock = ((db as any).__client__);

    await ethereumDb._getCollection('whateverCollectionToRetrieve');

    expect(getDbMock).toHaveBeenCalled();
    expect(getDbMock).toHaveBeenCalledWith('mockDatabase');

    expect(dbClientMock.collection).toHaveBeenCalled();
    expect(dbClientMock.collection).toHaveBeenCalledWith('whateverCollectionToRetrieve');

  });

  describe('_aggregateCollections', async () => {

    it('::should return the mongodb aggregationCursor successfully filtering by query', async () => {

      const collMock: Collection = ((db as any).__collection__);
      const cursorMock: AggregationCursor = ((db as any).__aggregationCursor__);
      const queryMock: any = {};

      const result = await ethereumDb._aggregateCollections(collMock, queryMock);

      expect(collMock.aggregate).toHaveBeenCalled();
      expect(result).toEqual(cursorMock);

      const firstCallArg = (collMock.aggregate as jest.Mock).mock.calls[0][0];
      expect(firstCallArg[0]).toHaveProperty('$match', queryMock);

    });

    it('::should return the mongodb aggregationCursor successfully without filter', async () => {

      const collMock: Collection = ((db as any).__collection__);
      const cursorMock: AggregationCursor = ((db as any).__aggregationCursor__);

      const result = await ethereumDb._aggregateCollections(collMock);

      expect(collMock.aggregate).toHaveBeenCalled();
      expect(result).toEqual(cursorMock);

      const firstCallArg = (collMock.aggregate as jest.Mock).mock.calls[0][0];
      expect(firstCallArg).not.toHaveProperty('$match');

    });

  });

  describe('with contracts collection', async () => {

    let getCollMock: jest.Mock;
    let aggregateCollMock: jest.Mock;

    let coll: any;
    let cursor: any;
    let getScQuery: jest.Mock;
    const collName: string = 'mockDatabaseCollectionContractInstances';

    beforeAll(() => {

      coll = ((db as any).__collection__);
      cursor = ((db as any).__aggregationCursor__);

      jest.spyOn(ethereumDb, '_getCollection').mockResolvedValue(coll);
      jest.spyOn(ethereumDb, '_aggregateCollections').mockReturnValue(cursor);
      getCollMock = (ethereumDb._getCollection as jest.Mock);
      aggregateCollMock = (ethereumDb._aggregateCollections as jest.Mock);

      getScQuery = (utils.getScQueryByAddressOrAlias as jest.Mock);

    });

    beforeEach(() => {

      jest.clearAllMocks();

    });

    it('::getSmartContractByAddressOrAlias should call getCollection and call dbClient.findOne with params', async () => {

      const mockedAddressOrAlias: string = 'mockAddressOrAlias';
      const mockedQuery: any = {};
      getScQuery.mockReturnValue(mockedQuery);

      await ethereumDb.getSmartContractByAddressOrAlias(mockedAddressOrAlias);

      expect(getCollMock).toHaveBeenCalledWith(collName);
      expect(getScQuery).toHaveBeenCalledWith(mockedAddressOrAlias);
      expect(aggregateCollMock).toHaveBeenCalledWith(coll, mockedQuery);
      expect(cursor.next).toHaveBeenCalled();

    });

  });

});
