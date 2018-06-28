// tslint:disable-next-line:variable-name
export const __collection__ = {
  count: jest.fn().mockReturnThis(),
  find: jest.fn().mockReturnThis(),
  findOne: jest.fn().mockReturnThis(),
  findOneAndDelete: jest.fn().mockReturnThis(),
  insertOne: jest.fn().mockReturnThis(),
  toArray: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
};

// tslint:disable-next-line:variable-name
export const __client__ = {
  collection: jest.fn().mockResolvedValue(__collection__),
};

export const connect = jest.fn();
export const close = jest.fn();
export const getClient = jest.fn();
export const getDb = jest.fn().mockResolvedValue(__client__);
