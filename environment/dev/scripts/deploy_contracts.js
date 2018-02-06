const fs = require('fs');
const config = require('config');
const cfg = config.get('app');

const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.WebsocketProvider(`ws://${cfg.blockchain.eth.host}:${cfg.blockchain.eth.port}`));


web3.eth
  .getAccounts()
  .then((accounts) => {

    console.log('accounts => \n', accounts);

    const abi = JSON.parse(fs.readFileSync(__dirname + '/contracts/Token.abi', 'utf8'));
    const bytecode = '0x' + fs.readFileSync(__dirname + '/contracts/Token.bin', 'utf8');

    var contract = new web3.eth.Contract(abi);
    const coinbase = accounts[0];
    // const coinbase = web3.eth.coinbase;

    contract.deploy({
      data: bytecode
    })
      .send({
        from: coinbase,
        gas: 1500000,
        gasPrice: '30000000000000'
      })
      .on('error', function (error) {

        console.error(error);

      })
      .on('transactionHash', function (transactionHash) {

        console.log('tx hash => ' + transactionHash) // tx hash  
      })
      .on('receipt', function (receipt) {

        console.log('address => ' + receipt.contractAddress) // contains the new contract address

      })
      // .on('confirmation', function(confirmationNumber, receipt){ ... })
      .then(function (newContractInstance) {

        console.log('new instasnce => ' + newContractInstance.options.address) // instance with the new contract address
        process.exit();

      });

  });

  // tx hash => 0xe6d2fc4101ce0724ac53d797cc161d4fec2768fbc941b9ea652aec26a93fcc6c
  // address => 0x8b72a93AC71f111BF00F0ba2F50A2555b03183aD
  // new instasnce => 0x8b72a93AC71f111BF00F0ba2F50A2555b03183aD