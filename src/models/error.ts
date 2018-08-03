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
    public message: string,
    public extendedError?: HancockError | Error) {

    super();
    this.internalCode = `${HancockError.prefix}${internalCode}`;

  }

  get extendedMessage(): string {
    return this.extendedError ? (`${this.extendedError.name}: ${this.extendedError.message}`) : '';
  }

}

export const hancockDefaultError = new HancockError('50000', 'Internal error');
export const hancockDbError = new HancockError('50001', 'Error fetching from database');
export const hancockBadRequestError = new HancockError('40000', 'Bad request');
export const hancockDltError = new HancockError('50300', 'Service Unavailable');
export const hancockNotFoundError = new HancockError('40400', 'Not Found');
export const hancockProviderError = new HancockError('50300', 'Service Unavailable');
export const hancockSubscriptionUnknownError = new HancockError('50002', 'Kind of subscription is unknown');
export const hancockParseError = new HancockError('50003', 'Error parsing data. Invalid data.');
export const hancockEventError = new HancockError('50004', 'Error in subscription to Smart Contract Event.');
export const hancockLogsError = new HancockError('50005', 'Error in subscription to Smart Contract Logs.');
export const hancockContractNotFoundError = new HancockError('50006', 'Smart Contract not found Error.');
export const hancockSubscribeToContractError = new HancockError('50007', 'Error in subscription to Smart Contract.');
export const hancockSubscribeToTransferError = new HancockError('50008', 'Error in subscription to Address.');
export const hancockNewBlockHeadersError = new HancockError('50009', 'Error in subscription to New Block Headers.');
export const hancockGetCodeError = new HancockError('50010', 'Error getting the code of the Smart Contract.');
export const hancockGetBlockError = new HancockError('50011', 'Error getting the info of the block.');
