import * as db from '../db/ethereum';
import { hancockDbError } from '../models/error';
import { IEthereumContractModel } from '../models/ethereum';
import { error } from '../utils/error';

export async function findOne(addressOrAlias: string): Promise<IEthereumContractModel | null> {

  let contractDbModel: IEthereumContractModel | null;

  try {

    contractDbModel = await db.getSmartContractByAddressOrAlias(addressOrAlias);

  } catch (err) {

    throw error(hancockDbError, err);

  }

  return contractDbModel;

}
