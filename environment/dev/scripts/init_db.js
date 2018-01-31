
try {
  
  function initDltAdapterDB() {

    constractsDb = db.getSiblingDB("DLT");
    collection = constractsDb.contracts;

    let res = [
      collection.drop(),
      collection.createIndex({ 'alias': 1 }),
      collection.createIndex({ 'address': 1 }),
      collection.createIndex({ 'abi': 1 }),
      collection.insert({ "alias": "token-contract-1", "address": "0x283649236492836492836492836823423423423", "abi": "98a7s8dya9sd8a9shd9ashd0a9s8dh9ashd9a8shd9ahsd98ahsd9asd98ahs9d" }), 
      collection.insert({ "alias": "token-contract-2", "address": "0x817254981275487152876351928461921286391", "abi": "98a7s8dya9sd8a9shd9ashd0a9s8dh9ashd9a8shd9ahsd98ahsd9asd98ahs9d" }), 
      collection.insert({ "alias": "token-contract-3", "address": "0x127912839127391826981295619837192379123", "abi": "98a7s8dya9sd8a9shd9ashd0a9s8dh9ashd9a8shd9ahsd98ahsd9asd98ahs9d" }), 
    ];

    printjson(res);
  }

  initDltAdapterDB();

} catch(error) {

  print('Error, exiting', error);
  quit(1);

}

quit(0);