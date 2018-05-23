
export type ISocketKind = 'watch-addresses' | 'watch-contracts';
export type ISocketBody = any;
export interface ISocketMessage {
    kind: ISocketKind;
    body: ISocketBody;
  }