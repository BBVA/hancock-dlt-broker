import {PROTOCOLS} from '../types';
import {ISocketEventBody} from './models';

export interface IEthereumContractModel {
  alias: string;
  address: string;
  abiName: string;
  abi: any[];
}

export interface IJwtModel {
  key: string;
  secret: string;
  expires_in: string;
}

export interface IEthereumProviderModel {
  providerName: string;
  protocol: PROTOCOLS;
  singEndPoint: string;
  jwt: IJwtModel;
  recoverPkEndPoint: string;
}

export type ethAddress = string;
export type ethContractAddress = string;
export type ethTxHash = string;
export type ethBlockHash = string;
export type ethData = string;
export type ethTopic = string;

export interface IEthContractEventBody extends ISocketEventBody {
  address: ethContractAddress;
  blockHash: ethBlockHash;
  blockNumber: number;
  event: string;
  id: 'log_5daf9707';
  logIndex: number;
  raw: {
    data: ethData;
    topics: ethTopic[];
  };
  returnValues: any;
  signature: null;
  transactionHash: ethTxHash;
  transactionIndex: number;
  type: 'mined';
}

export interface IEthTransactionBody extends ISocketEventBody {
  blockHash: ethBlockHash;
  blockNumber: number;
  from: ethAddress;
  gas: number;
  gasPrice: string;
  hash: ethTxHash;
  input: string;
  nonce: number;
  to: ethContractAddress;
  transactionIndex: number;
  value: string;
}

export interface IEthBlockHeader {
  hash: '0xf22152edb76673b5f6909e5693f786128760a3761c8a3ccd6b63a3ca45bd053c';
  parentHash: ethBlockHash;
  sha3Uncles: '0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347';
  miner: '0x0000000000000000000000000000000000000000';
  stateRoot: '0x261b0543dcd4474efe4f249eeb99fde8ed9b3e5b942cca1d5d8ef33055c75feb';
  transactionsRoot: '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421';
  receiptRoot: '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421';
  logsBloom: string;
  difficulty: '0';
  number: number;
  gasLimit: number;
  gasUsed: number;
  nonce: '0x0000000000000000';
  timestamp: number;
  extraData: '0x00';
  size: undefined;
}
