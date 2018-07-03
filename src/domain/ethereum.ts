import * as db from '../db/ethereum';
import { IEthereumContractModel } from '../models/ethereum';

export async function findOne(addressOrAlias: string): Promise<IEthereumContractModel | null> {

  const contractDbModel: IEthereumContractModel | null = await db.getSmartContractByAddressOrAlias(addressOrAlias);

  return contractDbModel;

}
