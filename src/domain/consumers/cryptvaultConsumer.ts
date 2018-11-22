import * as jwt from 'jsonwebtoken';
import * as request from 'request-promise-native';
import { v4 as uuidv4 } from 'uuid';
import { encryptedData, ISymmetricEncData, symmetricKey } from '../../models/crypto';
import { ISocketEvent } from '../../models/models';
import config from '../../utils/config';
import { CryptoUtils } from '../../utils/crypto';
import { error } from '../../utils/error';
import logger from '../../utils/logger';
import { dltAddress } from './../../models/models';
import { Consumer } from './consumer';
import {
  hancockEncryptError,
  hancockGetConsumerPKError,
  hancockGetConsumerTokenError,
  hancockGetWalletError,
} from './models/error';

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
      case 'event':
        switch (event.body.event) {
          case 'Transfer':
            return this.cypherEventAndSend(event);
        }
      default:
        return await super.notify(event);
    }

  }

  private async cypherEventAndSend(event: ISocketEvent): Promise<boolean> {
    event.matchedAddress = event.body.returnValues._from;
    await this.cypherAndSendTransfer(event);
    event.matchedAddress = event.body.returnValues._to;
    await this.cypherAndSendTransfer(event);
    return Promise.resolve(true);
  }

  private async cypherAndSendTransfer(event: ISocketEvent): Promise<boolean> {

    const token: string = this.getToken();
    // tslint:disable-next-line:max-line-length
    const walletEndpoint: string = config.consumers.cryptvault.api.getByAddressEndpoint.replace(':address', event.matchedAddress);

    logger.info('getting PK from cryptvault', walletEndpoint);

    let walletResponse: ICryptoVaultWalletResponse;

    try {

      walletResponse = await request.get(walletEndpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        json: true,
      });

      logger.info('Wallet response: ' + JSON.stringify(walletResponse));

    } catch (err) {

      logger.error(err);
      throw error(hancockGetConsumerPKError, err);

    }

    if (walletResponse.result && walletResponse.result.status_code === 200) {

      try {

        const itemKey: symmetricKey = CryptoUtils.generateSymmetricKey(32);
        const iv: symmetricKey = CryptoUtils.generateSymmetricKey(12);
        const aad: string = 'notifyTransaction';
        const txPayload: any = {
          item_id: walletResponse.data.item_id,
          raw_tx: event.body,
        };

        const cypheredTx: ICryptoVaultCypheredTransaction = {
          item_enc_key: CryptoUtils.encryptRSA(walletResponse.data.public_key, itemKey) as encryptedData,
          item_json: CryptoUtils.aesGCMEncrypt(JSON.stringify(txPayload), iv, aad, itemKey) as ISymmetricEncData,
        };

        const eventResponse: ICryptoVaultEvent = {
          address: event.matchedAddress as dltAddress,
          inOut: this.getTxDirection(event),
          tx: cypheredTx,
        };

        logger.info('Notify response: ' + JSON.stringify(eventResponse));

        super.notify({ kind: event.kind, body: eventResponse, matchedAddress: event.matchedAddress });
        return Promise.resolve(true);

      } catch (err) {

        throw error(hancockEncryptError, err);
      }

    } else {

      throw error(hancockGetWalletError);

    }
  }

  private getToken(): string {

    try {

      const requestId: string = uuidv4();

      return jwt.sign(
        {
         iss: config.consumers.cryptvault.credentials.key,
         txid: requestId,
        },
        config.consumers.cryptvault.credentials.secret,
        { expiresIn: config.consumers.cryptvault.credentials.expires_in },
      );

    } catch (err) {

      logger.error(err);
      throw error(hancockGetConsumerTokenError, err);

    }
  }

  private getTxDirection(event: ISocketEvent): ICryptoVaultEventTxDirection {
    let direction: ICryptoVaultEventTxDirection;
    if (event.kind === 'tx') {
      direction = (event.body.from.toUpperCase() === (event.matchedAddress as dltAddress).toUpperCase())
      ? ICryptoVaultEventTxDirection.OUT
      : ICryptoVaultEventTxDirection.IN;
    } else {
      direction = (event.body.returnValues._from.toUpperCase() === (event.matchedAddress as dltAddress).toUpperCase())
      ? ICryptoVaultEventTxDirection.OUT
      : ICryptoVaultEventTxDirection.IN;
    }
    return direction;
  }

}
