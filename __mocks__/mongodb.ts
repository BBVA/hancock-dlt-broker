// tslint:disable-next-line:variable-name
export const __dbClient__ = {
  close: jest.fn().mockReturnThis(),
  db: jest.fn().mockReturnThis(),
  on: jest.fn().mockReturnThis(),
};

export const MongoClient = {
  connect: jest.fn().mockResolvedValue(__dbClient__),
};
