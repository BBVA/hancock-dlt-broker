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
        "providerName": "SingleProvider",
        "protocol": "single",
        "singEndPoint": "https://kong-cryptvault-develop.kickstartteam.es/v1/wallets/:address/sign",
        "jwt": "",
        "recoverPkEndPoint": ""
      }),
      collection.insert({
        "providerName": "SecureProvider",
        "protocol": "secure",
        "singEndPoint": "http://hancock_sign_provider:3000/ethereum/sign-tx",
        "jwt": {
          "key": "OiYdLKOblAicxiasy2tJolbc3oBYkiyg",
          "secret": "umFfDtKwdv9k6uhu7EEA2Hwoe3aWaoTT",
          "expires_in": "1555674519"
        },
        "recoverPkEndPoint": "https://kong-cryptvault-develop.kickstartteam.es:443/v1/wallets/:address"
      }),
      collection.insert({
        "providerName": "Cryptvault",
        "protocol": "secure",
        "singEndPoint": "http://hancock_sign_provider:3000/ethereum/sign-tx",
        "jwt": {
          "key": "OiYdLKOblAicxiasy2tJolbc3oBYkiyg",
          "secret": "umFfDtKwdv9k6uhu7EEA2Hwoe3aWaoTT",
          "expires_in": "1555674519"
        },
        "recoverPkEndPoint": "https://kong-cryptvault-develop.kickstartteam.es:443/v1/wallets/:address"
      }),
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
