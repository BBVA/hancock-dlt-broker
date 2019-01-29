import * as WebSocket from 'ws';
import { IConsumer } from '../domain/consumers/consumer';
import { HancockError } from '../models/error';
import { logger } from './logger';

export function error(hancockError: HancockError, originalError?: HancockError | Error): HancockError {

  let retError: HancockError = hancockError;

  if (originalError instanceof HancockError) {

    retError = originalError;
    retError.errorStack.push(hancockError);

  } else {

    retError.extendedError = originalError;

  }

  return retError;

}

export function onError(socket: WebSocket, err: HancockError, terminate: boolean = false, consumer?: IConsumer) {

  logger.error(err);

  try {

    if (consumer) {
      consumer.notify({ kind: 'error', body: err });
    } else {

      if (socket.readyState === socket.OPEN) {
        socket.send(JSON.stringify({ kind: 'error', body: err }));
      }
    }

  } catch (innerErr) {

    logger.error(innerErr);

  }

  if (terminate) {
    socket.terminate();
  }
}
