const response = {
  data: {
    item_id: 'mockid',
    public_key: 'mockKey',
  },
  result: {
    description: 'mockdes',
    internal_code: 'mockcode',
    status_code: 200,
  },
};

// tslint:disable-next-line:variable-name
export const get = jest.fn().mockReturnValue(Promise.resolve(response));
