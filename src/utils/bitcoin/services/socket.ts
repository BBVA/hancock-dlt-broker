import {EventEmitter} from 'events';
import * as io from 'socket.io-client';
import {IBitcoinBlockHeader} from '../../../models/bitcoin';

/* istanbul ignore next */
export class BitcoinSocketService extends EventEmitter {
  private socketIO: SocketIOClient.Socket;
  constructor(public url: string) {
    super();
    this.socketIO = io.connect(url);
  }
  public subscribeToNewBLocks(): BitcoinSocketService {
    const room = 'inv';
    this.socketIO
      .on('connect', () => this.socketIO.emit('subscribe', room))
      .on('block', (data: IBitcoinBlockHeader) => {
        this.emit('data', data);
      });
    return this;
  }
}
