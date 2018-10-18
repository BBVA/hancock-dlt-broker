// tslint:disable-next-line:variable-name
export const __cipher__ = {
    finish: jest.fn().mockReturnThis(),
    mode: {
        tag: {
            toHex: jest.fn(),
        },
    },
    output: {
        data: jest.fn().mockReturnThis(),
    },
    start: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
  };

export const cipher = {
    createCipher: jest.fn().mockReturnValue(__cipher__),
};

export const tag = {
    toHex: jest.fn().mockReturnThis(),
};

export const util = {
    bytesToHex: jest.fn(),
    createBuffer: jest.fn().mockReturnThis(),
    decode64: jest.fn(),
    encode64: jest.fn(),
    hexToBytes: jest.fn(),
};

export const random = {
    getBytesSync: jest.fn(),
};

// tslint:disable-next-line:variable-name
export const __publicKeyFromPem__ = {
    encrypt: jest.fn(),
};

export const pki = {
    publicKeyFromPem: jest.fn().mockReturnValue(__publicKeyFromPem__),
};
