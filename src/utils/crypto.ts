import * as forge from 'node-forge';
import {asymmetricPublicKey, encryptedData, ISymmetricEncData, symmetricKey} from '../models/crypto';

export class CryptoUtils {

  /**
   *
   * @param {string} data To encrypt
   * @param {symmetricKey} iv Vector, should be a 12-byte binary-encoded string
   * @param {string} aad Plain String
   * @param {symmetricKey} key String Hex key to be used to cipher data.
   * @returns {ISymmetricEncData} Object which contains the data encrypted with a symmetric key
   */
  public static aesGCMEncrypt(data: string, iv: symmetricKey, aad: string, key: symmetricKey): ISymmetricEncData {
    const cipher = forge.cipher.createCipher('AES-GCM', forge.util.hexToBytes(key));
    cipher.start({
      additionalData: aad, // optional
      iv: forge.util.hexToBytes(iv), // should be a 12-byte binary-encoded string or byte buffer
      tagLength: 128, // optional, defaults to 128 bits
    });
    cipher.update(forge.util.createBuffer(data, 'utf8'));
    cipher.finish();
    const tag = cipher.mode.tag;

    const encription = cipher.output.data;
    const encription64 = forge.util.encode64(encription);
    const tagHex = tag.toHex();

    return {data: encription64, iv, aad, tag: tagHex};
  }

  /**
   * @param {int} length
   * @returns {string} Hex String containin a length-Byte symmetic key
   */
  public static generateSymmetricKey(length: number): symmetricKey {
    return forge.util.bytesToHex(forge.random.getBytesSync(length));
  }

  /**
   *
   * @param {string} publicKey. Base64-encoded string containing a Private Key PEM-formatted
   * @param {string} data. Data string to be encrypted
   * @returns {encryptedData} Encrypted data
   */
  public static encryptRSA(publicKey: asymmetricPublicKey, data: string): encryptedData {
    const pk = forge.pki.publicKeyFromPem(forge.util.decode64(publicKey));
    return forge.util.encode64(pk.encrypt(data, 'RSA-OAEP'));
  }

}
