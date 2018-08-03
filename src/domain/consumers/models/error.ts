import { HancockError } from '../../../models/error';

export const hancockGetConsumerTokenError = new HancockError('50012', 'Error creating api token of SignConsumer');
export const hancockGetConsumerPKError = new HancockError('50013', 'Error retrieving Pk from SignConsumer');
export const hancockGetWalletError = new HancockError('50014', 'Error fetching consumer wallet item');
export const hancockEncryptError = new HancockError('50015', 'Error encrypting message to send');
