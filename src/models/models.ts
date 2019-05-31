export type dltAddress = string;

export type ISocketMessageKind = SOCKET_EVENT_KINDS;

export enum SOCKET_EVENT_KINDS {
  WatchTransfer = 'watch-transfers',
  WatchTransaction = 'watch-transactions',
  WatchSmartContractTransaction = 'watch-contracts-transactions',
  WatchSmartContractDeployment = 'watch-contracts-deployments',
  WatchSmartContractEvent = 'watch-contracts-events',
  UnwatchTransfer = 'unwatch-transfers',
  UnwatchTransaction = 'unwatch-transactions',
  UnwatchSmartContractTransaction = 'unwatch-contracts-transactions',
  UnwatchSmartContractDeployment = 'unwatch-contracts-deployments',
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

export type ISocketEventBody = any;

export interface ISocketEvent {
  kind: CONSUMER_EVENT_KINDS;
  body: ISocketEventBody;
  raw?: ISocketEventBody;
  matchedAddress?: dltAddress;
}

export enum CONSUMER_EVENT_KINDS {
  Transfer = 'transfer',
  Transaction = 'transaction',
  SmartContractTransaction = 'contract-transaction',
  SmartContractDeployment = 'contract-deployment',
  SmartContractEvent = 'contract-event',
  Error = 'error',
}

export interface IHancockSocketTransactionBody extends ISocketEventBody {
  blockHash: string;
  blockNumber: number;
  transactionId: string;
  from: string;
  to: string;
  value: IHancockSocketCurrency;
  data: string;
  fee: IHancockSocketCurrency;
  newContractAddress?: string;
  timestamp: number;
}

export interface IHancockSocketCurrency {
  amount: string;
  decimals: number;
  currency: CURRENCY;
}

export enum CURRENCY {
  Ethereum = 'Ethereum',
}

export interface IHancockSocketContractEventBody extends ISocketEventBody {
  blockNumber: number;
  blockHash: string;
  transactionId: string;
  eventName: string;
  returnValues: string[];
  fee: IHancockSocketCurrency;
  timestamp: number;
}
