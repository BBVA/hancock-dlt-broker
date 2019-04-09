import * as jwt from 'jsonwebtoken';
import * as request from 'request-promise-native';
import {v4 as uuidv4} from 'uuid';
import * as WebSocket from 'ws';
import {encryptedData, ISymmetricEncData, symmetricKey} from '../../models/crypto';
import {IEthereumProviderModel} from '../../models/ethereum';
import {dltAddress, ISocketEvent} from '../../models/models';
import {CryptoUtils} from '../../utils/crypto';
import {error} from '../../utils/error';
import logger from '../../utils/logger';
import {Consumer} from './consumer';
import {hancockEncryptError, hancockGetConsumerTokenError, hancockGetWalletError} from './models/error';

export interface ISecureResult {
  status_code: number;
  description: string;
  internal_code: string;
}

export interface ISecureWalletResponseData {
  public_key: string;
  item_id: string;
}

export interface ISecureWalletResponse {
  result: ISecureResult;
  data: ISecureWalletResponseData;
}

export interface ISecureCypheredTransaction {
  item_json: ISymmetricEncData;
  item_enc_key: encryptedData;
}

export enum ISecureEventTxDirection {
  IN = 1,
  OUT = 0,
}

export interface ISecureEvent {
  tx: ISecureCypheredTransaction;
  address: dltAddress;
  inOut: number;
}

export class SecureConsumer extends Consumer {

  constructor(protected socket: WebSocket, protected providerData: IEthereumProviderModel) {
    super(socket);
  }

  public async notify(event: ISocketEvent): Promise<boolean> {
    logger.info('SecureConsumer: notify');
    switch (event.kind) {
      case 'tx':
        return await this.cypherAndSendTransfer(event);
      case 'event':
        switch (event.raw.event) {
          case 'Transfer':
            return this.cypherEventAndSend(event);
        }
      default:
        return await super.notify(event);
    }

  }

  private async cypherEventAndSend(event: ISocketEvent): Promise<boolean> {
    event.matchedAddress = event.raw.returnValues._from || event.raw.returnValues.from;
    await this.cypherAndSendTransfer(event);
    event.matchedAddress = event.raw.returnValues._to || event.raw.returnValues.to;
    await this.cypherAndSendTransfer(event);
    return Promise.resolve(true);
  }

  private async cypherAndSendTransfer(event: ISocketEvent): Promise<boolean> {
    logger.info('SecureConsumer: cypher and send transfer');

    const token: string = this.getToken();

    const walletEndpoint: string = this.providerData.recoverPkEndPoint.replace(':address', event.matchedAddress ? event.matchedAddress : '');

    logger.info('getting PK from secure provider', walletEndpoint);

    let walletResponse: ISecureWalletResponse;

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
      // throw error(hancockGetConsumerPKError, err);
      // TODO change this after refactor
      return Promise.resolve(true);
    }

    if (walletResponse.result && walletResponse.result.status_code === 200) {

      try {

        const itemKey: symmetricKey = CryptoUtils.generateSymmetricKey(32);
        const iv: symmetricKey = CryptoUtils.generateSymmetricKey(12);
        const aad: string = 'notifyTransaction';
        const txPayload: any = {
          item_id: walletResponse.data.item_id,
          raw_tx: event.raw,
        };

        const cypheredTx: ISecureCypheredTransaction = {
          item_enc_key: CryptoUtils.encryptRSA(walletResponse.data.public_key, itemKey) as encryptedData,
          item_json: CryptoUtils.aesGCMEncrypt(JSON.stringify(txPayload), iv, aad, itemKey) as ISymmetricEncData,
        };

        const eventResponse: ISecureEvent = {
          address: event.matchedAddress as dltAddress,
          inOut: this.getTxDirection(event),
          tx: cypheredTx,
        };

        logger.info('Notify response: ' + JSON.stringify(eventResponse));

        super.notify({kind: event.kind, body: eventResponse, matchedAddress: event.matchedAddress});
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
          iss: this.providerData.jwt.key,
          txid: requestId,
        },
        this.providerData.jwt.secret,
        {expiresIn: this.providerData.jwt.expires_in},
      );

    } catch (err) {

      logger.error(err);
      throw error(hancockGetConsumerTokenError, err);

    }
  }

  private getTxDirection(event: ISocketEvent): ISecureEventTxDirection {
    let direction: ISecureEventTxDirection;
    if (event.kind === 'tx') {
      direction = (event.raw.from.toUpperCase() === (event.matchedAddress as dltAddress).toUpperCase())
        ? ISecureEventTxDirection.OUT
        : ISecureEventTxDirection.IN;
    } else {
      const from: string = event.raw.returnValues._from || event.raw.returnValues.from;
      direction = (from.toUpperCase() === (event.matchedAddress as dltAddress).toUpperCase())
        ? ISecureEventTxDirection.OUT
        : ISecureEventTxDirection.IN;
    }
    return direction;
  }

}
