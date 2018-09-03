import * as express from 'express';
import * as http from 'http';
import { appRouter } from './routes/index';
import config from './utils/config';
import * as db from './utils/db';
import logger from './utils/logger';
import { getSocket } from './utils/socket';

export function run() {

  return db.connect().then(() => {

    const app = express();
    app.use(config.server.base, appRouter);

    const server = http.createServer(app);

    Object.keys(config.blockchain).forEach((dlt: string) => {

      const controller: any = require(`./controllers/${dlt}`).SocketSubscribeController;

      if (controller) {

        const ws = getSocket(`/${dlt}/subscribe`, server);
        ws.on('connection', controller);

      }

    });

    server.listen(config.server.port, (error: any) => {

      if (error) {
        return logger.error('Service is not available', error);
      }

      logger.info('Service available in port', config.server.port);

    });

  });

}

function exitHook(err?: any) {

  logger.info('Exiting gracefully...');

  if (err) {
    logger.error(err);
  }

  db.close();
  process.exit(0);

}

// The app is finishing
process.on('exit', exitHook);
// Catch the SIGINT signal (Ctrl+C)
process.on('SIGINT', exitHook);
// Catch uncaught exceptions from the program
process.on('uncaughtException', exitHook);
