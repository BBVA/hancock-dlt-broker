import 'jest';

jest.mock('config', () => {
  return { get: jest.fn() };
});

describe('utilsConfig', () => {

  const configLib = require('config');
  const configGetMock: jest.Mock = (configLib.get as any);

  it('should return the "app" config by default', () => {

    const configResponse: any = {
      whatever: 'whatever',
    };
    configGetMock.mockReturnValue(configResponse);

    const config: any = require('../config').default;
    expect(configGetMock).toHaveBeenCalledWith('app');
    expect(config.whatever).toBeDefined();

  });

});
