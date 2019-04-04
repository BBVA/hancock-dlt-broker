try {

  function initSmartContractInstancesDB() {

    hancockDb = db.getSiblingDB("hancock");
    collection = hancockDb.sc_instance;

    let res = [
      collection.drop(),
      collection.createIndex({'alias': 1}, {unique: true}),
      collection.createIndex({'address': 1}, {unique: true}),
      collection.createIndex({'abiName': 1}),
    ];

    printjson(res);
  }

  function initSmartContractAbisDB() {

    const abi = JSON.parse(cat('/scripts/adapter/contracts/EIP20.abi'));

    hancockDb = db.getSiblingDB("hancock");
    collection = hancockDb.sc_abi;

    let res = [
      collection.drop(),
      collection.createIndex({'name': 1}, {unique: true}),
      collection.createIndex({'abi': 1}),
    ];

    printjson(res);
  }

  function initProviders() {

    ethereumDb = db.getSiblingDB("hancock");
    collection = ethereumDb['providers'];

    let res = [
      collection.drop(),
      collection.createIndex({'name': 1}),
      collection.insert({
        "alias": "fake-provider-local",
        "endpoint": "http://hancock_sign_provider:3000/ethereum/sign-tx",
        "className": "Signer"
      }),
      collection.insert({
        "alias": "fake-provider-develop",
        "endpoint": "http://hancock_sign_provider:3000/ethereum/sign-tx",
        "className": "Signer"
      }),
      collection.insert({
        "alias": "fake-provider-demo",
        "endpoint": "http://hancock_sign_provider:3000/ethereum/sign-tx",
        "className": "Signer"
      }),
      collection.insert({"alias": "cryptvault", "className": "CryptvaultSigner"}),
    ];

    printjson(res);
  }

  initProviders();
  initSmartContractAbisDB();
  initSmartContractInstancesDB();

} catch (error) {

  print('Error, exiting', error);
  quit(1);

}

quit(0);
