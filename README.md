Hancock DLT Broker
====================

## Requirements
- [Node.js](https://nodejs.org/es/) >= v8.9.3 (npm v5.5.1)

## using the socket

We asume that there is an ethereum blockchain network with an rpc API open under the hostname: `ganache` and port: `8545`.
You can launch an ethereum test network in local easy, by following this steps:

```bash
  git clone `ssh://git@bitbucket.kickstartteam.es:7999/shut/ethereum-test.git`
  cd ethereum-test
  make dev
```

To run the microservice in local (in console):

```bash
make dev
```

To connect to the socket (from browser):
```javascript
let address = "0xd2Bb4b9C30DE543C2a247E818391F37A98E62D3F";
let sender = "0xF0fF42D561124786be9902206a758cDeE6f3D271";

ws = new WebSocket(`ws://localhost:3009/eth/subscribe?address=${address}&sender=${sender}`)
```

