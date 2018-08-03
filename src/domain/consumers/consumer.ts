import * as WebSocket from 'ws';
import { IEthTransactionBody } from '../../models/ethereum';
import { ISocketEvent } from '../../models/models';

export interface IConsumer {
  notify(event: ISocketEvent): Promise<boolean>;
}

export class Consumer implements IConsumer {

  constructor(protected socket: WebSocket) { }

  public async notify(event: ISocketEvent): Promise<boolean> {

    if (!event || !this.socket) {
      throw new Error('DEFAULT_ERROR');
    }

    this.socket.send(JSON.stringify(event));

    return Promise.resolve(true);

  }

  protected getSenderFromRawTx(rawTx: IEthTransactionBody): string {

    return rawTx.from;

  }

  protected getReceiverFromRawTx(rawTx: IEthTransactionBody): string {

    return rawTx.to;

  }
}
