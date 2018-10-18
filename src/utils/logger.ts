import * as pinoLib from 'pino';
import config from '../utils/config';

const pino = pinoLib({
  name: config.application,
  safe: true,
});

export const logger: pinoLib.Logger = pino.child({
  hostname: config.hostname,
  level: config.logger.logLevel,
});

export default logger;
