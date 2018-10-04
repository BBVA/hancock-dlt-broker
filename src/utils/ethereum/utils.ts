export function getScQueryByAddressOrAlias(addressOrAlias: string): {} {

  const addressPattern: RegExp = new RegExp(/^0x[a-fA-F0-9]{40}$/i);
  return addressPattern.test(addressOrAlias)
    ? { address: addressOrAlias }
    : { alias: addressOrAlias };

}
