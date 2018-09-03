const mock = {
  application: 'applicationName',
  blockchain: {
    ethereum: 'mockBlockchain',
  },
  consumers: {
    cryptvault: {
      api: {
        getByAddressEndpoint: 'mockgetbyAddress',
        notifyEndpoint: 'mockNotify',
      },
      credentials: {
        expires_in: 'mockexpires',
        key: 'mockkey',
        secret: 'mocksecret',
      },
    },
  },
  db: {
    database: 'mockDbDatabase',
    ethereum: {
      collections: {
        contractAbis: 'mockDatabaseCollectionContractAbis',
        contractInstances: 'mockDatabaseCollectionContractInstances',
      },
      database: 'mockDatabase',
    },
    hosts: 'mockDbHost:mockDbPort',
    params: 'mockDbParams',
    pass: 'mockDbPass',
    protocol: 'mockDbProtocol',
    user: 'mockDbUser',
  },
  protocol: 'http://mockEncode?c=__CODE__',
};

export default mock;
