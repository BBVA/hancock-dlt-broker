import * as mongodb from 'mongodb';
import { Db } from 'mongodb';
import config from './config';

let client: Db;

export async function connect(): Promise<Db> {

  if (client) {
    return Promise.resolve(client);
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

      client = mongoClient;
      return client;

    })
    .catch((err: any) => {

      throw new Error('Error conecting with mongo ' + err);

    });

}

export async function close(): Promise<void> {

  return client
    ? client.close()
    : Promise.resolve();

}

export async function getClient(): Promise<Db> {

  return client
    ? client
    : connect();

}

export function getDb(database: string) {

  return getClient().then((cli: Db) => cli.db(database));

}
