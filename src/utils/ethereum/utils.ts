import { IEthContractEventBody, IEthTransactionBody } from '../../models/ethereum';
import { CURRENCY, IHancockSocketContractEventBody, IHancockSocketTransactionBody } from '../../models/models';

export function getScQueryByAddressOrAlias(addressOrAlias: string): {} {

  const addressPattern: RegExp = new RegExp(/^0x[a-fA-F0-9]{40}$/i);
  return addressPattern.test(addressOrAlias)
    ? { address: addressOrAlias }
    : { alias: addressOrAlias };

}

export const generateHancockTransactionSLbody = (txBody: IEthTransactionBody, timestamp: number) => {
  const hsl: IHancockSocketTransactionBody = {
    blockHash: txBody.blockHash,
    blockNumber: txBody.blockNumber,
    transactionId: txBody.hash,
    from: txBody.from,
    to: txBody.to,
    value: {
      amount: txBody.value,
      decimals: 18,
      currency: CURRENCY.Ethereum,
    },
    data: txBody.input,
    fee: {
      amount: (txBody.gas * Number(txBody.gasPrice)).toString(),
      decimals: 18,
      currency: CURRENCY.Ethereum,
    },
    timestamp,
  };
  return hsl;
};

export const generateHancockContractSLbody = (eventBody: IEthContractEventBody, fee: string, timestamp: number) => {
  const body: IHancockSocketContractEventBody = {
    blockNumber: eventBody.blockNumber,
    blockHash: eventBody.blockHash,
    transactionId: eventBody.transactionHash,
    smartContractAddress: eventBody.address,
    eventName: eventBody.event,
    returnValues: eventBody.returnValues,
    fee: {
      amount: fee,
      decimals: 18,
      currency: CURRENCY.Ethereum,
    },
    timestamp,
  };
  return body;
};
