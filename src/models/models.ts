import { CONSUMERS } from './../domain/consumers/types';

export type dltAddress = string;

export interface IRawTransaction {
  from: dltAddress;
  to: dltAddress;
  value: string;
}

export type ISocketMessageKind = SOCKET_EVENT_KINDS;
export enum SOCKET_EVENT_KINDS {
  WatchTransfer = 'watch-transfers',
  WatchTransacion = 'watch-transactions',
  WatchSmartContractTransacion = 'watch-contracts-transactions',
  WatchSmartContractEvent = 'watch-contracts-events',
  UnwatchTransfer = 'unwatch-transfers',
  UnwatchTransacion = 'unwatch-transactions',
  UnwatchSmartContractTransacion = 'unwatch-contracts-transactions',
  UnwatchSmartContractEvent = 'unwatch-contracts-events',
  // Deprecated
  ObsoleteWatchSmartContractEvent = 'watch-contracts',
  ObsoleteUnwatchSmartContractEvent = 'unwatch-contracts',
}

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

export enum CONSUMER_EVENT_KINDS {
  Transfer = 'transfer',
  Transacion = 'transacion',
  SmartContractTransacion = 'contract-transacion',
  SmartContractEvent = 'contract-event',
}
