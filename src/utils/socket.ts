import { Express } from 'express';
import * as WebSocket from 'ws';
import config from './config';

export function getSocket(path: string, server?: any) {

  // const server = new http.Server(app);
  // const wss = new WebSocket.Server({ server, path });

  const wss = new WebSocket.Server({ server, path, perMessageDeflate: false });

  return wss;

}
