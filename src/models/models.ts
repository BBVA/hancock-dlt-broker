export type dltAddress = string;

export interface IRawTransaction {
  from: dltAddress;
  to: dltAddress;
  value: string;
}

export type ISocketMessageKind = SOCKET_EVENT_KINDS;

export enum SOCKET_EVENT_KINDS {
  WatchTransfer = 'watch-transfers',
  WatchTransaction = 'watch-transactions',
  WatchSmartContractTransaction = 'watch-contracts-transactions',
  WatchSmartContractEvent = 'watch-contracts-events',
  UnwatchTransfer = 'unwatch-transfers',
  UnwatchTransaction = 'unwatch-transactions',
  UnwatchSmartContractTransaction = 'unwatch-contracts-transactions',
  UnwatchSmartContractEvent = 'unwatch-contracts-events',
  // Deprecated
  ObsoleteWatchSmartContractEvent = 'watch-contracts',
  ObsoleteUnwatchSmartContractEvent = 'unwatch-contracts',
}

export type ISocketMessageStatus = MESSAGE_STATUS;

export enum MESSAGE_STATUS {
  Mined = 'mined',
  Pending = 'pending',
}

export type ISocketMessageBody = any;

export interface ISocketMessage {
  kind: ISocketMessageKind;
  body: ISocketMessageBody;
  status?: ISocketMessageStatus;
  consumer?: string;
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
  Transaction = 'transaction',
  SmartContractTransaction = 'contract-transaction',
  SmartContractEvent = 'contract-event',
}
