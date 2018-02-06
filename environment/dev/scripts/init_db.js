
try {
  
  function initDltAdapterDB() {

    const abi = JSON.parse(cat('/scripts/contracts/Token.abi'));

    constractsDb = db.getSiblingDB("ETH");
    collection = constractsDb.contracts;

    let res = [
      collection.drop(),
      collection.createIndex({ 'alias': 1 }),
      collection.createIndex({ 'address': 1 }),
      collection.createIndex({ 'abi': 1 }),
      collection.insert({ "alias": "token-contract-1", "address": "0x8b72a93AC71f111BF00F0ba2F50A2555b03183aD", "abi": abi }),
    ];

    printjson(res);
  }

  initDltAdapterDB();

} catch(error) {

  print('Error, exiting', error);
  quit(1);

}

quit(0);