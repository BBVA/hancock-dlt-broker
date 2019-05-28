export interface IHancockError extends Error {
  internalCode: string;
  message: string;
  extendedMessage: string;
  errorStack: HancockError[];
}

export interface IHancockErrorResponse {
  error: number;
  internalError: string;
  message: string;
  extendedMessage?: string;
}

export class HancockError extends Error implements IHancockError {

  private static prefix: string = 'HKBR';

  public name: string = 'HancockError';
  public errorStack: HancockError[] = [];

  constructor(
    public internalCode: string,
    public httpCode: number,
    public message: string,
    public extendedError?: HancockError | Error) {

    super();
    this.internalCode = `${HancockError.prefix}${internalCode}`;

  }

  get extendedMessage(): string {
    return this.extendedError ? (`${this.extendedError.name}: ${this.extendedError.message}`) : '';
  }

}

export const hancockDefaultError = new HancockError('50000', 500, 'Internal error');
export const hancockDbError = new HancockError('50001', 500, 'Error fetching from database');
export const hancockBadRequestError = new HancockError('40000', 400, 'Bad request');
export const hancockDltError = new HancockError('50300', 503, 'Service Unavailable');
export const hancockNotFoundError = new HancockError('40400', 404, 'Not Found');
export const hancockProviderError = new HancockError('50300', 503, 'Service Unavailable');
export const hancockMessageKindUnknownError = new HancockError('50002', 500, 'Message "kind" unknown');
export const hancockParseError = new HancockError('50003', 500, 'Error parsing data. Invalid data.');
export const hancockEventError = new HancockError('50004', 500, 'Error subscribing to Smart Contract Event.');
export const hancockLogsError = new HancockError('50005', 500, 'Error subscribing to Smart Contract Logs.');
export const hancockContractNotFoundError = new HancockError('50006', 500, 'Smart Contract not found Error.');
export const hancockSubscribeToContractError = new HancockError('50007', 500, 'Error subscribing to Smart Contract.');
export const hancockSubscribeToTransferError = new HancockError('50008', 500, 'Error subscribing to Address.');
export const hancockNewBlockHeadersError = new HancockError('50009', 500, 'Error subscribing to New Block Headers.');
export const hancockGetCodeError = new HancockError('50010', 500, 'Error getting the code of the Smart Contract.');
export const hancockGetBlockError = new HancockError('50011', 500, 'Error getting the info of the block.');
export const hancockTransactionError = new HancockError('50012', 500, 'Error getting the info of the transaction.');
export const hancockPendingTransactionsSubscriptionError = new HancockError('50013', 500, 'Error subscribing to pending transactions.');
export const hancockDeployContractError = new HancockError('50014', 500, 'Error getting new address of the deployed contract.');
