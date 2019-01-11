import { NextFunction, Request, Response } from 'express';
import {Db} from 'mongodb';
import config from '../utils/config';
import * as db from '../utils/db';
import {getWeb3} from '../utils/ethereum';
import logger from '../utils/logger';

export async function healthCheckController(req: Request, res: Response, next: NextFunction) {

  let ethereumIsListening: boolean = false;
  let mongoIsAlive: Db;
  let allConnected = false;

  try {
    ethereumIsListening = await (await getWeb3()).eth.net.isListening();
    mongoIsAlive = await db.getClient();

    if (ethereumIsListening && mongoIsAlive) {
      allConnected = true;
    }

  } catch (error) {
    logger.error(error);
  }

  if (allConnected) {
    res
      .status(200)
      .json({
        app: config.application,
        success: true,
      });
  } else {
    res
      .status(500)
      .json({
        success: false,
      });
    process.exit();
  }

}
