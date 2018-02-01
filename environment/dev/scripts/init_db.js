
try {
  
  function initDltAdapterDB() {

    constractsDb = db.getSiblingDB("ETH");
    collection = constractsDb.contracts;

    let res = [
      collection.drop(),
      collection.createIndex({ 'alias': 1 }),
      collection.createIndex({ 'address': 1 }),
      collection.createIndex({ 'abi': 1 }),
      collection.insert({ "alias": "token-contract-1", "address": "0x2d467F4D9DAA9C4713Cf063CE57364C4856ee217", "abi": [{"constant":false,"inputs":[],"name":"destroyContract","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"duration","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"validityStart","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"beneficiary","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_data","type":"uint256"}],"name":"attest","outputs":[{"name":"","type":"int256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"claim","outputs":[{"name":"","type":"int256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"validityLife","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"attestedFinalValue","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"device","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"attestedInitialValue","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"voucherState","outputs":[{"name":"","type":"uint8"}],"payable":false,"type":"function"},{"inputs":[{"name":"_beneficiary","type":"address"},{"name":"_device","type":"address"},{"name":"_duration","type":"uint256"},{"name":"_conditionOperator","type":"uint256"},{"name":"_conditionValue","type":"uint256"}],"payable":false,"type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"timestamp","type":"uint256"},{"indexed":false,"name":"method","type":"string"},{"indexed":false,"name":"newState","type":"string"},{"indexed":false,"name":"message","type":"string"}],"name":"VoucherEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"method","type":"string"},{"indexed":false,"name":"message","type":"string"}],"name":"Error","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"timestamp","type":"uint256"},{"indexed":false,"name":"method","type":"string"},{"indexed":false,"name":"newState","type":"string"},{"indexed":false,"name":"attestedValue","type":"uint256"}],"name":"VoucherIssuanceEvent","type":"event"}] }), 
      collection.insert({ "alias": "voucher-contract-2", "address": "0x817254981275487152876351928461921286391", "abi": [{"constant":false,"inputs":[],"name":"destroyContract","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"duration","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"validityStart","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"beneficiary","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_data","type":"uint256"}],"name":"attest","outputs":[{"name":"","type":"int256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"claim","outputs":[{"name":"","type":"int256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"validityLife","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"attestedFinalValue","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"device","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"attestedInitialValue","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"voucherState","outputs":[{"name":"","type":"uint8"}],"payable":false,"type":"function"},{"inputs":[{"name":"_beneficiary","type":"address"},{"name":"_device","type":"address"},{"name":"_duration","type":"uint256"},{"name":"_conditionOperator","type":"uint256"},{"name":"_conditionValue","type":"uint256"}],"payable":false,"type":"constructor"},{"anonymous":false,"inputs":[{"indexed":false,"name":"timestamp","type":"uint256"},{"indexed":false,"name":"method","type":"string"},{"indexed":false,"name":"newState","type":"string"},{"indexed":false,"name":"message","type":"string"}],"name":"VoucherEvent","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"method","type":"string"},{"indexed":false,"name":"message","type":"string"}],"name":"Error","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"timestamp","type":"uint256"},{"indexed":false,"name":"method","type":"string"},{"indexed":false,"name":"newState","type":"string"},{"indexed":false,"name":"attestedValue","type":"uint256"}],"name":"VoucherIssuanceEvent","type":"event"}] }),
    ];

    printjson(res);
  }

  initDltAdapterDB();

} catch(error) {

  print('Error, exiting', error);
  quit(1);

}

quit(0);