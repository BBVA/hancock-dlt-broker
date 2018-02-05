export interface IEthereumContractModel {
  alias: string;
  address: string;
  abi: any[];
}

export type ethAddress = string;
export type ethContractAddress = string;
export type ethTrxHash = string;
export type ethBlockHash = string;
export type ethData = string;
export type ethTopic = string;

export interface IEthContractEventBody {
  logIndex: number;
  transactionIndex: number;
  transactionHash: ethTrxHash;
  blockHash: ethBlockHash;
  blockNumber: number;
  address: ethContractAddress;
  type: 'mined';
  id: 'log_5daf9707';
  returnValues: any;
  event: undefined;
  signature: null;
  raw: {
    data: ethData;
    topics: ethTopic[];
  };
}

export interface IEthContractLogBody {
  address: ethContractAddress;
  blockHash: ethBlockHash;
  blockNumber: number;
  data: ethData;
  id: 'log_5daf9707';
  logIndex: number;
  topics: ethTopic[];
  transactionHash: ethTrxHash;
  transactionIndex: number;
  type: 'mined';
}

export interface IEthTransactionBody {
  hash: ethTrxHash;
  nonce: number;
  blockHash: ethBlockHash;
  blockNumber: number;
  transactionIndex: number;
  from: ethAddress;
  to: ethContractAddress;
  value: '0';
  gas: number;
  gasPrice: '100000000000';
  input: string;
}

export interface IEthBlockHeader {
  hash: '0xf22152edb76673b5f6909e5693f786128760a3761c8a3ccd6b63a3ca45bd053c';
  parentHash: ethBlockHash;
  sha3Uncles: '0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347';
  miner: '0x0000000000000000000000000000000000000000';
  stateRoot: '0x261b0543dcd4474efe4f249eeb99fde8ed9b3e5b942cca1d5d8ef33055c75feb';
  transactionsRoot: '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421';
  receiptsRoot: '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421';
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
