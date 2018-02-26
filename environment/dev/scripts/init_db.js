
try {
  
  function initDltAdapterDB() {

    const tokenAbi = JSON.parse(cat('/scripts/broker/contracts/EIP20.abi'));
    const exchangerAbi = JSON.parse(cat('/scripts/broker/contracts/Exchanger.abi'));    

    constractsDb = db.getSiblingDB("hancock");
    collection = constractsDb.smartcontracts;

    let res = [
      collection.drop(),
      collection.createIndex({ 'alias': 1 }),
      collection.createIndex({ 'address': 1 }),
      collection.insert({ "alias": "exchanger", "address": "0x39d658743881ef3a53cc6c969377613baab46b1e", "abi": exchangerAbi }),      
      collection.insert({ "alias": "token-DRGN", "address": "0x965cf4d51ddbb5505588a0de66c34baa8eb9e10d", "abi": tokenAbi }),
      collection.insert({ "alias": "token-OMG", "address": "0x040bc133e7b526ab13d5b08aa7c7e6b2bca6cea3", "abi": tokenAbi }),
      collection.insert({ "alias": "token-TRX", "address": "0xccc7384e7a4446c85ee1d577c4192ec849918d46", "abi": tokenAbi }),
      collection.insert({ "alias": "token-EOS", "address": "0xf533200f2627d4cc02bd7c44e72283cc0e0251ba", "abi": tokenAbi }),
      collection.insert({ "alias": "token-BNB", "address": "0x99caf3e67f148d703cb53f33128693bce393e67f", "abi": tokenAbi }),
      collection.insert({ "alias": "token-VEN", "address": "0x4e569f9425e0decabd6427631de605ea8a5ad57d", "abi": tokenAbi }),
    ];

    printjson(res);
  }

  initDltAdapterDB();

} catch(error) {

  print('Error, exiting', error);
  quit(1);

}

quit(0);