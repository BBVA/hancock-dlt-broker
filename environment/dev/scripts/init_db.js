
try {
  
  function initDltAdapterDB() {   

    constractsDb = db.getSiblingDB("hancock");
    collection = constractsDb.smartcontracts;

    let res = [
      collection.drop(),
      collection.createIndex({ 'alias': 1 }, { unique: true }),
      collection.createIndex({ 'address': 1 }, { unique: true }),
      collection.createIndex({ 'abi': 1 }),
    ];

    printjson(res);
  }

  initDltAdapterDB();

} catch(error) {

  print('Error, exiting', error);
  quit(1);

}

quit(0);