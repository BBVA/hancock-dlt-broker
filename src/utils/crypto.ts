import * as forge from 'node-forge';
import {
  asymmetricPublicKey,
  encryptedData,
  ISymmetricEncData,
  symmetricKey,
} from '../models/crypto';

// import ByteBuffer from "node-forge";

export class CryptoUtils {

  // public static passwordGenerator(password: string): string {
  //   const passwordBytes = CryptoUtils.makeByteArrayFromString(password);
  //   const m1Bytes = CryptoUtils.makeByteArrayFromHexString(CryptoUtils.M1);
  //   const resultBytes = CryptoUtils.XORbytes(m1Bytes, passwordBytes);
  //   return CryptoUtils.byteArrayToHexString(resultBytes);
  // }

  // public static retrievePassword(m2: string): string {
  //   const m1Bytes = CryptoUtils.makeByteArrayFromHexString(CryptoUtils.M1);
  //   const m2bytes = CryptoUtils.makeByteArrayFromHexString(m2);
  //   const xorbytes = CryptoUtils.XORbytes(m1Bytes, m2bytes);
  //   return CryptoUtils.byteArrayToString(xorbytes);
  // }

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

    return { data: encription64, iv, aad, tag: tagHex };
  }

  // /**
  //  *
  //  * @param {encryptedData} encData Encrypted data base64-encoded
  //  * @param {symmetricKey} iv Initialization Vector as String Hex
  //  * @param {string} aad Additional Data. Plain String
  //  * @param {string} tag Control data as String Hex
  //  * @param {symmetricKey} key String Hex key to be used to cipher data.
  //  * @returns {string | Object | null} Decrypted data
  //  */
  // public static aesGCMDecrypt
  // (encData: encryptedData, iv: symmetricKey, aad: string,
  // tag: string, key: symmetricKey): string | Object | null {
  //   const decipher = forge.cipher.createDecipher('AES-GCM', forge.util.hexToBytes(key));
  //   const data64 = forge.util.decode64(encData);
  //   const data = forge.util.createBuffer(data64);

  //   decipher.start({
  //     iv: forge.util.createBuffer(forge.util.hexToBytes(iv)),
  //     additionalData: aad, // optional
  //     tagLength: 128, // optional, defaults to 128 bits
  //     tag: forge.util.createBuffer(forge.util.hexToBytes(tag)) // authentication tag from encryption
  //   });
  //   decipher.update(data);
  //   const pass = decipher.finish();
  //   if(pass) {
  //     return forge.util.decodeUtf8(decipher.output.data);
  //   }
  //   else {
  //     return null;
  //   }
  // }

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

  // /**
  //  *
  //  * @param {string} privateKey Base64-encoded string containing a Private Key PEM-formatted
  //  * @param {encryptedData} data Base64-encoded string containing encrypted data
  //  * @returns {string | Object | null} Decrypted data
  //  */
  // public static decryptRSA(privateKey: asymmetricPrivateKey, data: encryptedData): string | Object | null {
  //   try{
  //     const sk = forge.pki.privateKeyFromPem(forge.util.decode64(privateKey));
  //     return sk.decrypt(forge.util.decode64(data), 'RSA-OAEP');
  //   }
  //   catch(e) {
  //     return null;
  //   }
  // }

  // /**
  //  *
  //  * @param {string} data. String that contains data to be hashed
  //  * @returns {string} String Containin result
  //  */
  // public static getMD5Hash(data: string): string {
  //   const hash = forge.crypto.createHash('md5');
  //   hash.update(data);
  //   return hash.digest('hex');
  // }

  // /**
  //  *
  //  * @param {string} data. String that contains data to be hashed
  //  * @returns {string} String Containin result
  //  */
  // public static getSHA1Hash(data: string): string {
  //   const hash = forge.crypto.createHash('sha1');
  //   hash.update(data);
  //   return hash.digest('hex');
  // }

  // /**
  //  *
  //  * @param {string} data. String that contains data to be hashed
  //  * @returns {string} String Containin result
  //  */
  // public static getSHA256Hash(data: string): string {
  //   const hash = forge.crypto.createHash('sha256');
  //   hash.update(data);
  //   return hash.digest('hex');
  // }

  // /**
  //  *
  //  * @param {string} data
  //  * @returns {string} String representing data base64-encoded
  //  */
  // public static base64encode(data: string) {
  //   return forge.util.encode64(data);
  // }

  // /**
  //  *
  //  * @param {string} data. String representing data base64-encoded
  //  * @returns {string} Plain-text data
  //  */
  // public static base64decode(data: string): string {
  //   return forge.util.decode64(data);
  // }

  // /**
  //  *
  //  * @param {string} data. String containing the data to be signed. If an Object, must be Stringify first
  //  * @param {string} skPem. Private Key base64-encoded PEM String
  //  * @returns {ISignature | null} Object containing SHA1 Hash of data and signed data
  //  */
  // public static signData(data: string, skPem: asymmetricPrivateKey): ISignature | null {
  //   const sk = forge.pki.privateKeyFromPem(skPem);
  //   const new_md = forge.md.sha1.create();
  //   new_md.update(data, 'utf8');
  //   const pss = forge.pss.create({
  //     md: forge.md.sha1.create(),
  //     mgf: forge.mgf.mgf1.create(forge.md.sha1.create()),
  //     saltLength: 20
  //     // optionally pass 'prng' with a custom PRNG implementation
  //   });
  //   const signature = sk.sign(new_md, pss);
  //   if(!signature) {
  //     return null;
  //   }
  //   else {
  //     const signature64 = forge.util.encode64(signature);
  //     const itemHash = new_md.digest().toHex();
  //     return {
  //       hash: itemHash,
  //       signature: signature64
  //     };
  //   }
  // }

  // /**
  //  *
  //  * @param {string} hash. String containing the SHA1 hash of the data of the signature
  //  * @param {signature} signature. Signature itself having the binary base64-encoded
  //  * @param {asymmetricPublicKey} pkPem.  Public Key base64-encoded PEM String
  //  * @returns {boolean} Result of verification
  //  */
  // public static verifySignature(hash: string, signature: signature, pkPem: asymmetricPublicKey): boolean {
  //   let verified = false;
  //   const pk = forge.pki.publicKeyFromPem(pkPem);
  //   const pss = forge.pss.create({
  //     md: forge.md.sha1.create(),
  //     mgf: forge.mgf.mgf1.create(forge.md.sha1.create()),
  //     saltLength: 20
  //   });
  //   try {
  //     verified = pk.verify(forge.util.binary.hex.decode(hash), forge.util.decode64(signature), pss);
  //   }
  //   catch (verException) {
  //     verified = false;
  //   }
  //   return verified;
  // }

  // public static generateOTPCode(): string {
  //   const rand = (Math.random()).toString();
  //   return rand.substring(2, 8);
  // }

  // /**
  //  *
  //  * @returns {IRSAKeyPair}
  //  */
  // public static generateRSAKeyPair(): IRSAKeyPair | null {
  //   try{
  //     const keyPair = forge.rsa.generateKeyPair({bits: 2048, e: 0x10001, workers: -1});
  //     const pk = forge.util.encode64(forge.pki.publicKeyToPem(keyPair.publicKey));
  //     const sk = forge.util.encode64(forge.pki.privateKeyToPem(keyPair.privateKey));
  //     return {public_key: pk, private_key: sk};
  //   }
  //   catch(e) {
  //     return null;
  //   }
  // }

  // /**
  //  * M1 and M2 are both random hexadecimal values
  //  * original password is a random string
  //  * M2 must be produce from a XOR operation over M1 and password
  //  **/
  // private static makeByteArrayFromString(str: string): any[] {
  //   const bytes = [];
  //   for (let i = 0; i < (str.length); i++) {
  //     bytes.push(str.charCodeAt(i));
  //   }

  //   return bytes;
  // };

  // private static makeByteArrayFromHexString(hex: string): any[] {
  //   const bytes = [];
  //   for (let i = 0; i < hex.length; i += 2) {
  //     bytes.push(parseInt(hex.substr(i, 2), 16));
  //   }
  //   return bytes;
  // }

  // private static byteArrayToHexString(bytes: any[]): string {
  //   const hex = [];
  //   for (let i = 0; i < bytes.length; i++) {
  //     hex.push((bytes[i] >>> 4).toString(16));
  //     hex.push((bytes[i] & 0xF).toString(16));
  //   }
  //   return hex.join("");
  // }

  // private static XORbytes(byteArray1: any[], byteArray2: any[]): any {
  //   const retVal = [];
  //   for (let i = 0; i < byteArray1.length; i++) {
  //     retVal[i] = (byteArray1[i] ^ byteArray2[i]);
  //   }
  //   return retVal;
  // }

  // private static byteArrayToString(array: any[]): string {
  //   const buffer = new Buffer(array);
  //   return buffer.toString('utf8').replace(/\0/g, '');
  // }

  // private static M1: string = '8e7b99b596cebcc7b3c8a040f130a0c0467192ff257eadde1acad3026d13b18d';
}
