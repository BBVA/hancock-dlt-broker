# Hancock DLT Broker

Microservice belonging to Hancock's ecosystem which creates a subscription to the blockchain 
watching for events related with some addresses or smart contracts

## Overview

Hancock is a research product conceived within BBVA New digital business - R&D that provides convenient services to integrate with different DLT networks. We provide simplicity, adaptability and efficiently to develop in any DLT. Hancock can be divided into three main components:

- [DLT Adapter](https://github.com/BBVA/hancock-dlt-adapter) - Keep it simple
Interface to abstract interaction with different DLT networks.

- [Wallet Hub](https://github.com/BBVA/hancock-wallet-hub) - Enroute Interactions
Enable connect their signer wallets, or wallet service providers, to the wallet hub, that will then route any ready-to-sign transaction.

- [DLT Broker](https://github.com/BBVA/hancock-dlt-broker) - Real time notifications
Provides a websocket connection that propagates any DLT event the user is subscribed. Thus, provides an interface to easily and efficiently subscribe to blockchain asynchronous events to avoid constant request of status.

## Motivation

Because blockchain is an event-based system, data writing is asynchronous. To facilitate the management of these events to third parties, a service that allows standardized subscription through a client-server socket is required, thus serving the changes detected in the ledger by means of said socket.

## Proposed Change

The service will connect to the blockchain when a client connects to the websocket exposed by the service.

The blockchain will be specified in the request by query-param. The fields allowed for the filter are a sender address and/or a contract address. If a sender address is specified, all pending transaction events related to the sender will be captured. If a contract address is specified, all the events programmed in it will be captured. It is mandatory specify at least one filter.

When an event is triggered in the blockchain that meets the requirements of the filter, the service will capture and launch it to the connected client that started the connection through websocket.

### Current blockchains supported

* Ethereum

### Building the service

Clone the project:
```bash
  # Clone the project 
  git clone https://github.com/BBVA/hancock-dlt-broker.git
  cd kst-hancock-ms-dlt-broker
```

With node and npm or yarn:
```bash
  # With npm
  npm install
  npm run build:ts
  npm run serve:prod

  # With yarn
  yarn install
  yarn run build:ts
  yarn run serve:prod
```

With [docker](https://www.docker.com/):
```bash
  # Build the docker image
  docker build -t hancock_dlt_broker .

  # Run the docker container
  docker run -d -it --name -p 80:80 hancock_dlt_broker_container hancock_dlt_broker
```

### Setting up the service

Once we have built the service, we need to configure a few things before launching it. You can find all environment vars 
available to configure the service in `config/custom-environment-variables.yaml`.

An example of configuration of the most important vars:

- Ethereum rpc node:
```bash
  export HANCOCK_BLOCKCHAIN_ETHEREUM_PROTOCOL="http"
  export HANCOCK_BLOCKCHAIN_ETHEREUM_HOST="52.80.128.77"
  export HANCOCK_BLOCKCHAIN_ETHEREUM_PORT="34774"
```

- Mongo ddbb host:
```bash
  export HANCOCK_DB_HOSTS="localhost:27017"
  export HANCOCK_DB_DATABASE="hancock"
  export HANCOCK_DB_ETHEREUM_DATABASE="hancock_eth"
```

### Using the service

The hancock broker service is accessible by an standard web socket interface. You can test it in a browser console, as follows:

```javascript
let address = "0xd2Bb4b9C30DE543C2a247E818391F37A98E62D3F";
let sender = "0xF0fF42D561124786be9902206a758cDeE6f3D271";

ws = new WebSocket(`ws://localhost:3009/ethereum/subscribe?address=${address}&sender=${sender}`)
```

### Async API Docs

Documentation about the async API can be found in this [link](https://BBVA.github.io/hancock-dlt-broker/api.html)

### Contribution guidelines

If you are thinking about contributing to the project, you should know that:

- The code has been written following the [clean architecture principles](https://8thlight.com/blog/uncle-bob/2012/08/13/the-clean-architecture.html), as well as [SOLID design principles](https://es.wikipedia.org/wiki/SOLID).

- The project is built in [typescript](https://www.typescriptlang.org/) v2.9.2 using the [recommended guidelines](https://github.com/palantir/tslint/blob/master/src/configs/recommended.ts). Also there is a linter rules configured to follow this guidelines, so you can search for a plugin for your favourite IDE to be warned about this linter errors.
