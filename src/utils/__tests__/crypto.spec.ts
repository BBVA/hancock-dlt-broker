import {
  CryptoUtils,
} from '../crypto';

import { NextFunction, Request, Response, Router } from 'express';

import 'jest';

import * as forge from 'node-forge';
jest.mock('node-forge');

describe('crypto', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('aesGCMEncrypt', () => {

    const data = 'data';
    const iv = 'symetrickey';
    const aad = 'address';
    const key = 'key';

    (forge.__cipher__.mode.tag.toHex as jest.Mock).mockReturnValue('mockedTag');
    (forge.util.encode64 as jest.Mock).mockReturnValue('mockedEncode');
    (forge.util.hexToBytes as jest.Mock).mockReturnValue('mockedKey');

    it('should Encrypt the message', () => {
      const result = CryptoUtils.aesGCMEncrypt(data, iv, aad, key);
      expect((forge.cipher.createCipher as jest.Mock)).toHaveBeenCalled();
      expect((forge.cipher.createCipher as jest.Mock)).toHaveBeenCalledWith('AES-GCM', 'mockedKey');

      expect(result).toEqual({
        aad: 'address',
        data: 'mockedEncode',
        iv: 'symetrickey',
        tag: 'mockedTag',
      });
    });
  });

  describe('generateSymmetricKey', () => {

    const length = 0;

    (forge.random.getBytesSync as jest.Mock).mockReturnValue('mockedBytes');
    (forge.util.bytesToHex as jest.Mock).mockReturnValue('mockedHex');
    it('should generate Symmetric Key', () => {
      const result = CryptoUtils.generateSymmetricKey(length);
      expect((forge.util.bytesToHex as jest.Mock)).toHaveBeenCalled();
      expect((forge.util.bytesToHex as jest.Mock)).toHaveBeenCalledWith('mockedBytes');

      expect(result).toEqual('mockedHex');
    });
  });

  describe('encryptRSA', () => {

    const publicKey = 'asymmetricPublicKey';
    const dataEnc = 'data';

    (forge.util.decode64 as jest.Mock).mockReturnValue('mockedDecode');
    (forge.util.encode64 as jest.Mock).mockReturnValue('mockedEncode');

    it('should encrypt public Key', () => {

      (forge.__publicKeyFromPem__.encrypt as jest.Mock).mockReturnValue('mockedEncrypt');

      const result = CryptoUtils.encryptRSA(publicKey, dataEnc);

      expect((forge.pki.publicKeyFromPem as jest.Mock)).toHaveBeenCalled();
      expect((forge.pki.publicKeyFromPem as jest.Mock)).toHaveBeenCalledWith('mockedDecode');
      expect((forge.util.encode64 as jest.Mock)).toHaveBeenCalled();
      expect((forge.util.encode64 as jest.Mock)).toHaveBeenCalledWith('mockedEncrypt');

      expect(result).toEqual('mockedEncode');
    });
  });
});
