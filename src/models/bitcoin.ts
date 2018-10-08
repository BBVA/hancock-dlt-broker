import responses from '../utils/responses';

/* istanbul ignore next */
export interface IBitcoinTransferSendRequest {
  from: string;
  to: string;
  value: string;
  data?: string;
}

/* istanbul ignore next */
export interface IBitcoinBlockHeader {
  bits?: string;
  chainwork?: string;
  confirmations?: number;
  difficulty?: number;
  hash: string;
  height?: number;
  isMainChain?: boolean;
  merkleroot?: string;
  nonce?: number;
  poolInfo?: object;
  previousblockhash?: string;
  reward?: number;
  size?: number;
  time?: number;
  tx?: string[];
  version?: number;
}

/* istanbul ignore next */
export interface IBitcoinBlockBody {
  pagesTotal: number;
  txs: IBitcoinTransaction[];
}

/* istanbul ignore next */
export interface IBitcoinTransaction {
  blockhash: string;
  blockheight: number;
  blocktime: number;
  confirmations: number;
  isCoinBase?: boolean;
  fees?: number;
  locktime: number;
  size: number;
  time: number;
  txid: string;
  valueIn?: number;
  valueOut: number;
  version: number;
  vin: IBitcoinTransactionVin[];
  vout: IBitcoinTransactionVout[];
}

/* istanbul ignore next */
export interface IBitcoinTransactionVin {
  coinbase?: string;
  sequence: number;
  n: number;
  addr?: string;
  doubleSpentTxID?: boolean;
  scriptSig?: {
    hex: string;
    asm: string;
  };
  txid?: string;
  value?: number;
  valueSat?: number;
  vout?: number;
}

/* istanbul ignore next */
export interface IBitcoinTransactionVout {
  value: string;
  n: number;
  scriptPubKey: {
    hex: string;
    asm: string;
    addresses: string[];
    type: string;
  };
  spentTxId: string;
  spentIndex: string;
  spentHeight: string;
}

/* istanbul ignore next */
export interface IBitcoinResponse {
  code: string;
  message: string;
  statusCode: number;
}

/* istanbul ignore next */
export const bitcoinBadRequestResponse: IBitcoinResponse = {
  code: responses.ndbgeneral400.code,
  message: 'Bitcoin - Bad request',
  statusCode: 400,
};

/* istanbul ignore next */
export const bitcoinErrorResponse: IBitcoinResponse = {
  code: responses.ndbsmartcontract500.code,
  message: 'Bitcoin - Blockchain request error',
  statusCode: 500,
};

/* istanbul ignore next */
export const bitcoinOkResponse: IBitcoinResponse = {
  code: responses.ndbsmartcontract202.code,
  message: 'Bitcoin - Operation successfully requested',
  statusCode: 202,
};

/* istanbul ignore next */
export interface IBitcoinTransferResponse {
  code: string;
  message: string;
  statusCode: number;
}

/* istanbul ignore next */
export const bitcoinTransferBadRequestResponse: IBitcoinTransferResponse = {
  code: responses.ndbgeneral400.code,
  message: 'BitcoinTransfer - Bad request',
  statusCode: 400,
};

/* istanbul ignore next */
export const bitcoinTransferDDBBErrorResponse: IBitcoinTransferResponse = {
  code: responses.ndbsmartcontract500.code,
  message: 'BitcoinTransfer - Internal ddbb error',
  statusCode: 500,
};

/* istanbul ignore next */
export const bitcoinTransferErrorResponse: IBitcoinTransferResponse = {
  code: responses.ndbsmartcontract500.code,
  message: 'BitcoinTransfer - Blockchain request error',
  statusCode: 500,
};

/* istanbul ignore next */
export const bitcoinTransferOkResponse: IBitcoinTransferResponse = {
  code: responses.ndbsmartcontract202.code,
  message: 'BitcoinTransfer - Blockchain transaction successfully sent. Consensus pending',
  statusCode: 202,
};

/* istanbul ignore next */
export const bitcoinTransferSyncOkResponse: IBitcoinTransferResponse = {
  code: responses.ndbsmartcontract202.code,
  message: 'BitcoinTransfer - Blockchain transaction successful',
  statusCode: 200,
};
