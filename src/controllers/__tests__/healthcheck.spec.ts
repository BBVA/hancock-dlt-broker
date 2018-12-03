
import 'jest';
import { healthCheckController } from '../healthcheck';

jest.mock('../../utils/config');
jest.mock('../../utils/db');
jest.mock('../../utils/ethereum');
jest.mock('../../utils/logger');

describe('healthcheckController', async () => {
  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {

    req = {};

    res = {
      json: jest.fn(),
      status: jest.fn().mockImplementation(() => res),
    };

    next = jest.fn();

  });

  it('should return 200 and the application name from config', async () => {

    await healthCheckController(req, res, next);

    expect(res.status.mock.calls).toEqual([[200]]);
    expect(res.json.mock.calls).toEqual([[{
      app: 'applicationName',
      success: true,
    }]]);

  });

});
