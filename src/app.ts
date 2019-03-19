import * as express from 'express';
import * as http from 'http';
import * as url from 'url';
import * as WebSocket from 'ws';
import {appRouter} from './routes';
import config from './utils/config';
import * as db from './utils/db';
import logger from './utils/logger';

export function run() {

  return db.connect().then(() => {

    const app = express();
    app.use(config.server.base, appRouter);

    const server = http.createServer(app);
    const sockets: Map<string, object> = new Map();

    Object.keys(config.blockchain).forEach((dlt: string) => {

      const controller: any = require(`./controllers/${dlt}/${dlt}`).SocketSubscribeController;

      if (controller) {
        const wss: WebSocket.Server = new WebSocket.Server({noServer: true});
        const path = `/${dlt}/subscribe`;
        sockets.set(path, {
          controller,
          wss,
        });
        wss.on('connection', controller);
      }
    });

    server.on('upgrade', (request: any, socket: any, head: any) => {
      const pathname = url.parse(request.url).pathname;
      const socketObject: object | undefined = (pathname) ? sockets.get(pathname) : undefined;
      if (socketObject) {
        // @ts-ignore
        socketObject.wss.handleUpgrade(request, socket, head, (ws) => {
          // @ts-ignore
          socketObject.wss.emit('connection', ws, request);
        });
      } else {
        socket.destroy();
      }
    });

    server.listen(config.server.port, () => {

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
// Catch Unhandled promise rejection from the program
process.on('unhandledRejection', exitHook);
