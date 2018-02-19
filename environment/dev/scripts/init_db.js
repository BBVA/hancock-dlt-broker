
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
      collection.insert({ "alias": "token-contract-1", "address": "0x084aab8a1C4bE53c925888a8AaA777c9Da50CDe6", "abi": abi }),
    ];

    printjson(res);
  }

  initDltAdapterDB();

} catch(error) {

  print('Error, exiting', error);
  quit(1);

}

quit(0);