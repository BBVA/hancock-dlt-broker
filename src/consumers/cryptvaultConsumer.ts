import * as jwt from 'jsonwebtoken';
import * as request from 'request-promise-native';
import { v4 as uuidv4 } from 'uuid';
import { encryptedData, ISymmetricEncData, symmetricKey } from '../models/crypto';
import { ISocketEvent } from '../models/models';
import { IRawTransaction, ISocketEventBody } from '../models/models';
import config from '../utils/config';
import { CryptoUtils } from '../utils/crypto';
import { dltAddress } from './../models/models';
import { Consumer } from './consumer';

export interface ICryptoVaultResult {
  status_code: number;
  description: string;
  internal_code: string;
}

export interface ICryptoVaultWalletResponseData {
  public_key: string;
  item_id: string;
}

export interface ICryptoVaultWalletResponse {
  result: ICryptoVaultResult;
  data: ICryptoVaultWalletResponseData;
}

export interface ICryptoVaultCypheredTransaction {
  item_json: ISymmetricEncData;
  item_enc_key: encryptedData;
}

export enum ICryptoVaultEventTxDirection {
  IN = 1,
  OUT = 0,
}

export interface ICryptoVaultEvent {
  tx: ICryptoVaultCypheredTransaction;
  address: dltAddress;
  inOut: number;
}

export class CryptvaultConsumer extends Consumer {

  public async notify(event: ISocketEvent): Promise<boolean> {

    switch (event.kind) {
      case 'tx':
        return await this.cypherAndSendTransfer(event);
      default:
        return await super.notify(event);
    }

  }

  private async cypherAndSendTransfer(event: ISocketEvent): Promise<boolean> {

    const token: string = this.getToken();
    // tslint:disable-next-line:max-line-length
    const walletEndpoint: string = config.consumers.cryptvault.api.getByAddressEndpoint.replace(':address', event.body.from);

    console.log('getting PK from cryptvault', walletEndpoint);

    const walletResponse: ICryptoVaultWalletResponse = await request.get(walletEndpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      json: true,
    });

    console.log('Wallet response: ' + JSON.stringify(walletResponse));

    if (walletResponse.result && walletResponse.result.status_code === 200) {

      const txPayload: ISocketEventBody = event.body;

      const itemKey: symmetricKey = CryptoUtils.generateSymmetricKey(32);
      const iv: symmetricKey = CryptoUtils.generateSymmetricKey(12);
      const aad: string = 'notifyTransaction';

      const cypheredTx: ICryptoVaultCypheredTransaction = {
        item_enc_key: CryptoUtils.encryptRSA(walletResponse.data.public_key, itemKey) as encryptedData,
        item_json: CryptoUtils.aesGCMEncrypt(JSON.stringify(txPayload), iv, aad, itemKey) as ISymmetricEncData,
      };

      const eventResponse: ICryptoVaultEvent = {
        address: event.matchedAddress as dltAddress,
        inOut: this.getTxDirection(event),
        tx: cypheredTx,
      };

      console.log('Notify response: ' + JSON.stringify(eventResponse));

      super.notify({ kind: event.kind, body: eventResponse, matchedAddress: event.matchedAddress });
      return Promise.resolve(true);

    } else {
      throw new Error('error recovering wallet');
    }
  }

  private getToken(): string {

    const requestId: string = uuidv4();

    return jwt.sign(
      {
       iss: config.consumers.cryptvault.credentials.key,
       txid: requestId,
      },
      config.consumers.cryptvault.credentials.secret,
      { expiresIn: config.consumers.cryptvault.credentials.expires_in },
    );
  }

  private getTxDirection(event: ISocketEvent): ICryptoVaultEventTxDirection {
    return (event.body.to.toUpperCase() === (event.matchedAddress as dltAddress).toUpperCase())
      ? ICryptoVaultEventTxDirection.IN
      : ICryptoVaultEventTxDirection.OUT;
  }

}
