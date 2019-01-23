import { CONSUMERS } from './../domain/consumers/types';

export type dltAddress = string;

export interface IRawTransaction {
  from: dltAddress;
  to: dltAddress;
  value: string;
}

export type ISocketMessageKind = 'watch-transfers' | 'watch-transactions' | 'watch-contracts';
export type ISocketMessageStatus = 'mined' | 'pending';
export type ISocketMessageBody = any;
export interface ISocketMessage {
  kind: ISocketMessageKind;
  body: ISocketMessageBody;
  status?: ISocketMessageStatus;
  consumer?: CONSUMERS;
}

export type ISocketEventKind = 'tx' | 'log' | 'event' | 'error';
export type ISocketEventBody = any;
export interface ISocketEvent {
  kind: ISocketEventKind;
  body: ISocketEventBody;
  matchedAddress?: dltAddress;
}
