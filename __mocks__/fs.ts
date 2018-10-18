import 'jest';

export const readFileSync = jest.fn().mockReturnValue(JSON.stringify({}));
