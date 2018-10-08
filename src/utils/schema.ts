import {validate} from 'jsonschema';
import * as WebSocket from 'ws';
import {IConsumer} from '../domain/consumers/consumer';
import {hancockBadRequestError, HancockError} from '../models/error';
import {error, onError} from './error';

export function validateSchema(data: any, schema: any, socket: WebSocket, consumerInstance: IConsumer): boolean {

  try {

    validate(data, schema, { throwError: true });
    return true;

  } catch (err) {

    const e: HancockError = error(hancockBadRequestError, err);
    onError(socket, e, false, consumerInstance);
    return false;

  }

}
