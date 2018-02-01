import { NextFunction, Request, Response, Router } from 'express';
import * as domain from '../domain/eth';

export function SubscribeController(req: Request, res: Response, next: NextFunction) {

  const address: string = req.query.address;
  const sender: string = req.query.sender;

  console.log(address, sender);
  if (!address || !sender) {
    throw new Error('DEFAULT_ERROR');
  }

  domain
    .subscribe(address, sender)
    .then((response: any) => res.send(response))
    .catch(next);

}
