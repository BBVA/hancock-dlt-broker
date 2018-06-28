import { Collection, Db } from 'mongodb';
import { IEthereumContractModel } from '../models/ethereum';
import config from '../utils/config';
import * as db from '../utils/db';
import { getScQueryByAddressOrAlias } from '../utils/utils';

const database: string = config.db.ethereum.database;
const collection: string = config.db.ethereum.collections.contracts;

// tslint:disable-next-line:variable-name
export const _getCollection = async (): Promise<Collection> => {
  return await db.getDb(database).then((client: Db) => client.collection(collection));
};

export async function subscribe(addressOrAlias: string): Promise<IEthereumContractModel | null> {

  const query = getScQueryByAddressOrAlias(addressOrAlias);

  const coll = await _getCollection();

  return coll.findOne(query);

}
