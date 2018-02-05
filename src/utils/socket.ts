import { Express } from 'express';
import * as http from 'http';
import * as WebSocket from 'ws';

export function getSocket(path: string) {

  // const server = new http.Server(app);
  // const wss = new WebSocket.Server({ server, path });
  const wss = new WebSocket.Server({ port: 8080, path, perMessageDeflate: false });

  return wss;

}
