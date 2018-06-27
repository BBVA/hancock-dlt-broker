
// tslint:disable-next-line:variable-name
export const __cryptoUtilsInstance__ = {
  aesGCMDecrypt: jest.fn().mockReturnThis(),
  aesGCMEncrypt: jest.fn().mockReturnThis(),
  generateSymmetricKey: jest.fn().mockReturnThis(),
  encryptRSA: jest.fn().mockReturnThis(),
  passwordGenerator: jest.fn().mockReturnThis(),
  retrievePassword: jest.fn().mockReturnThis(),
  decryptRSA: jest.fn().mockReturnThis(),
  getMD5Hash: jest.fn().mockReturnThis(),
  getSHA1Hash: jest.fn().mockReturnThis(),
  getSHA256Hash: jest.fn().mockReturnThis(),
  base64encode: jest.fn().mockReturnThis(),
  base64decode: jest.fn().mockReturnThis(),
  signData: jest.fn().mockReturnThis(),
  verifySignature: jest.fn().mockReturnThis(),
  generateOTPCode: jest.fn().mockReturnThis(),
  generateRSAKeyPair: jest.fn().mockReturnThis(),
  makeByteArrayFromString: jest.fn().mockReturnThis(),
  makeByteArrayFromHexString: jest.fn().mockReturnThis(),
  byteArrayToHexString: jest.fn().mockReturnThis(),
  XORbytes: jest.fn().mockReturnThis(),
  byteArrayToString: jest.fn().mockReturnThis(),
};

// tslint:disable-next-line:variable-name
export const CryptoUtils = jest.fn().mockImplementation(() => __cryptoUtilsInstance__);
