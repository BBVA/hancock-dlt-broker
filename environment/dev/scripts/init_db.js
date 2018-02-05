
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
      collection.insert({ "alias": "token-contract-1", "address": "0x3392be3C68A52049cCa0e85108874160436c2FB7", "abi": abi }), 
      collection.insert({ "alias": "token-contract-2", "address": "0xd2Bb4b9C30DE543C2a247E818391F37A98E62D3F", "abi": abi }),
    ];

    printjson(res);
  }

  initDltAdapterDB();

} catch(error) {

  print('Error, exiting', error);
  quit(1);

}

quit(0);