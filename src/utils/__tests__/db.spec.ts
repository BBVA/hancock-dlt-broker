import 'jest';
import * as mongodb from 'mongodb';
import { Db } from 'mongodb';
import config from '../config';
import * as utilsDb from '../db';

jest.mock('mongodb');
jest.mock('../config');

describe('utilsDb', () => {

  const mongodbMongoClientConnectMock: jest.Mock = (mongodb.MongoClient.connect as any);
  const mongodbDbClient: Db = (mongodb as any).__dbClient__;

  beforeEach(() => {

    // restore internal var
    delete utilsDb._client;
    mongodbMongoClientConnectMock.mockClear();

  });

  describe('::connect', () => {

    it('should return the conection with ddbb if it already exists', async () => {

      const clientMock: Db = {} as any;

      (utilsDb._client as any) = clientMock;
      const result: Db = await utilsDb.connect();

      expect(result).toBe(clientMock);

    });

    it('should open a connection using mongodb lib', async () => {

      const result: Db = await utilsDb.connect();

      const expectedCallArg: string = `mockDbProtocol://mockDbUser:mockDbPass@mockDbHost:mockDbPort/mockDbDatabase?mockDbParams`;
      expect(mongodbMongoClientConnectMock).toHaveBeenCalledWith(expectedCallArg);
      expect(utilsDb._client).toBe(mongodbDbClient);
      expect(result).toBe(mongodbDbClient);

    });

    it('should open a connection using mongodb lib (without user credentials)', async () => {

      delete config.db.user;

      await utilsDb.connect();

      const expectedCallArg: string = `mockDbProtocol://mockDbHost:mockDbPort/mockDbDatabase?mockDbParams`;
      expect(mongodbMongoClientConnectMock).toHaveBeenCalledWith(expectedCallArg);

    });

    it('should throw an exception if there are error connecting with ddbb', async () => {

      mongodbMongoClientConnectMock.mockRejectedValueOnce(new Error('Boom!'));

      try {

        const result: Db = await utilsDb.connect();

      } catch (e) {

        expect(mongodbMongoClientConnectMock).toHaveBeenCalled();
        expect(utilsDb._client).toBeUndefined();
        expect(e).toEqual(new Error('Error conecting with mongo Error: Boom!'));

      }

    });

  });

  describe('::close', () => {

    it('should close the connection with ddbb if it exists', async () => {

      const clientMock: Db = {
        close: jest.fn().mockResolvedValue(true),
      } as any;

      (utilsDb._client as any) = clientMock;
      await utilsDb.close();

      expect(clientMock.close).toHaveBeenCalled();

    });

    it('should return a resolved promise if there is no client', async () => {

      await utilsDb.close();

      expect(utilsDb._client).toBeUndefined();

    });

  });

  describe('::getClient', () => {

    it('should return the dbClient if it exists', async () => {

      const clientMock: Db = {} as any;

      (utilsDb._client as any) = clientMock;
      const result: Db = await utilsDb.getClient();

      expect(result).toBe(clientMock);

    });

    it('should call db.connect if there is no dbClient and return the dbClient', async () => {

      const clientMock: Db = {} as any;
      (utilsDb.connect as jest.Mock) = jest.fn().mockResolvedValue(clientMock);

      const result: Db = await utilsDb.getClient();

      expect(utilsDb.connect).toHaveBeenCalled();
      expect(result).toBe(clientMock);

    });

  });

  describe('::getDb', () => {

    it('should return the dbClient using the given database', async () => {

      const databaseName: string = 'mockedDatabaseName';

      const clientMock: Db = {
        db: jest.fn().mockReturnThis(),
      } as any;

      (utilsDb.getClient as jest.Mock) = jest.fn().mockResolvedValue(clientMock);

      const result: Db = await utilsDb.getDb(databaseName);

      expect(utilsDb.getClient).toHaveBeenCalled();
      expect(clientMock.db).toHaveBeenCalledWith(databaseName);
      expect(result).toBe(clientMock);

    });

  });

});
