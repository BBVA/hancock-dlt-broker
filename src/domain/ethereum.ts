import { NextFunction, Request, Response, Router } from 'express';
import { Collection, Db } from 'mongodb';
import { IEthereumContractModel } from '../models/ethereum';
import config from '../utils/config';
import * as db from '../utils/db';

const addressPattern = new RegExp(/^0x[a-fA-F0-9]{40}$/i);

const database: string = config.db.ethereum.database;
const collection: string = config.db.ethereum.collection;

async function getCollection(): Promise<Collection> {
  return await db.getDb(database).then((client: Db) => client.collection(collection));
}

export async function subscribe(addressOrAlias: string): Promise<IEthereumContractModel> {

  const query = addressPattern.test(addressOrAlias) ? {address: addressOrAlias} : {alias: addressOrAlias};

  const coll = await getCollection();

  return coll
    .find<IEthereumContractModel>(query)
    .limit(1)
    .toArray()
    .then((items) => items[0]);

}
