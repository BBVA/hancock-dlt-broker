import { NextFunction, Request, Response, Router } from 'express';
import { Collection, Db } from 'mongodb';
import { IEthereumContractModel } from '../models/eth';
import config from '../utils/config';
import * as db from '../utils/db';

const database: string = config.db.eth.database;
const collection: string = config.db.eth.collection;

async function getCollection(): Promise<Collection> {
  return await db.getDb(database).then((client: Db) => client.collection(collection));
}

export async function subscribe(address: string, sender: string): Promise<IEthereumContractModel> {

  const coll = await getCollection();

  return coll
    .find<IEthereumContractModel>({
      address,
    })
    .limit(1)
    .toArray()
    .then((items) => items[0]);

}
