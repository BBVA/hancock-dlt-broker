import 'jest';

export const error = jest.fn().mockImplementation((e) => e);
export const onError = jest.fn().mockImplementation((socket, err, terminate, consumer) => err);
