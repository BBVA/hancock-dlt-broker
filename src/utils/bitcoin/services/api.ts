import * as request from 'request-promise-native';
import {IBitcoinBlockBody} from '../../../models/bitcoin';
import {hancockNewBlockHeadersError} from '../../../models/error';
import {error} from '../../error';

/* istanbul ignore next */
export class BitcoinApiService {
  constructor(public urlBase: string) {
  }

  public async getBlock(block: string): Promise<IBitcoinBlockBody> {
    let response: IBitcoinBlockBody;
    try {

      response = await request.get(`${this.urlBase}/insight-api/txs/?block=${block}`, {json: true});

    } catch (e) {
      throw error(hancockNewBlockHeadersError, e);
    }
    return response;
  }
}
