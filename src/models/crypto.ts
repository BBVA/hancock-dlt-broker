/**
 * String Hex key to be used to cipher data generated with generateSymmetricKey() method
 */
export type symmetricKey = string;

/**
 * Base64-Encoded RSA PEM-format Public Key
 */
export type asymmetricPublicKey = string;

/**
 * Base64-Encoded RSA PEM-format Private Key
 */
export type asymmetricPrivateKey = string;

/**
 *
 */
export type encryptedData = string;

/**
 *
 */
export type signature = string;

export interface ISymmetricEncData {
  data: encryptedData;
  iv: symmetricKey;
  aad: string;
  tag: string;
}

export interface ISignature {
  hash: string;
  signature: signature;
}

export interface IRSAKeyPair {
  public_key: asymmetricPublicKey;
  private_key: asymmetricPrivateKey;
}
