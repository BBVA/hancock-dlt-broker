# Hancock Dlt Broker

Microservice belonging to Hancock's ecosystem which creates a subscription to the blockchain 
watching for events related with some addresses or smart contracts

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

Once we have built the service, we need to configure a few things before launch it. You can find all environment vars 
availables to configure the service in `config/custom-environment-variables.yaml`.

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

Documentation about the async API can be found in this [link](https://BBVA.github.io/hancock-dlt-broker/docs/api.html)

### Contribution guidelines

If you are thinking in contribute to the project you should know that:

- The code has been written following the [clean architecture principles](https://8thlight.com/blog/uncle-bob/2012/08/13/the-clean-architecture.html), as well as [SOLID design principles](https://es.wikipedia.org/wiki/SOLID).

- The project is built in [typescript](https://www.typescriptlang.org/) v2.9.2 using the [recommended guidelines](https://github.com/palantir/tslint/blob/master/src/configs/recommended.ts). Also there is a linter rules configured to follow this guidelines, so you can search for a plugin for your favourite IDE to be warned about this linter errors.
