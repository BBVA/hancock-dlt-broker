import * as mongodb from 'mongodb';
import { Db } from 'mongodb';
import config from './config';

// tslint:disable-next-line:variable-name
export let _client: Db;

export const connect = async (): Promise<Db> => {

  if (_client) {
    return Promise.resolve(_client);
  }

  const MongoClient = mongodb.MongoClient;
  let credentials: string = '';

  if (config.db.user && config.db.pass) {
    credentials = `${config.db.user}:${config.db.pass}@`;
  }

  // Connection URL
  // tslint:disable-next-line:max-line-length
  const url: string = `${config.db.protocol}://${credentials}${config.db.host}:${config.db.port}/${config.db.database}?${config.db.params}`;

  console.log('connection string = ', url);

  // Use connect method to connect to the server
  return MongoClient
    .connect(url)
    .then((mongoClient: Db) => {

      console.log('Connected successfully to server');

      _client = mongoClient;
      return _client;

    })
    .catch((err: any) => {

      throw new Error('Error conecting with mongo ' + err);

    });

};

export async function close(): Promise<void> {

  return _client
    ? _client.close()
    : Promise.resolve();

}

export const getClient = async (): Promise<Db> => {

  return _client
    ? _client
    : connect();

};

export function getDb(database: string): Promise<Db> {

  return getClient().then((cli: Db) => cli.db(database));

}
