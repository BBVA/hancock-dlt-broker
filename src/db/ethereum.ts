import {AggregationCursor, Collection, Db} from 'mongodb';
import {IEthereumContractModel, IEthereumProviderModel} from '../models/ethereum';
import config from '../utils/config';
import * as db from '../utils/db';
import {getScQueryByAddressOrAlias} from '../utils/ethereum/utils';

const database: string = config.db.ethereum.database;
const providersInstancesCollection: string = config.db.ethereum.collections.providers;
const contractsInstancesCollection: string = config.db.ethereum.collections.contractInstances;
const contractsAbisCollection: string = config.db.ethereum.collections.contractAbis;

// tslint:disable-next-line:variable-name
export const _getCollection = async (collection: string): Promise<Collection> => {
  return db.getDb(database).then((client: Db) => client.collection(collection));
};

// tslint:disable-next-line:variable-name
export const _aggregateCollections = (coll: Collection, query?: any): AggregationCursor<any> => {

  const stages: any[] = [
    {
      $lookup: {
        as: 'abiJoin',
        foreignField: 'name',
        from: contractsAbisCollection,
        localField: 'abiName',
      },
    },
    {
      $replaceRoot: {newRoot: {$mergeObjects: [{$arrayElemAt: ['$abiJoin', 0]}, '$$ROOT']}},
    },
    {$project: {abiJoin: 0, _id: 0, name: 0}},
  ];

  if (query) {
    stages.unshift({$match: query});
  }

  return coll.aggregate(stages);
};

export async function getProviderByAlias(alias: string): Promise<IEthereumProviderModel | null> {
  const coll = await _getCollection(providersInstancesCollection);
  return await coll.findOne({providerName: alias});
}

export async function getSmartContractByAddressOrAlias(addressOrAlias: string): Promise<IEthereumContractModel | null> {

  const coll: Collection = await _getCollection(contractsInstancesCollection);

  const query: any = getScQueryByAddressOrAlias(addressOrAlias);

  return _aggregateCollections(coll, query).next();

}
