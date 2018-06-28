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
        contracts: 'mockDatabaseCollectionContracts',
      },
      database: 'mockDatabase',
    },
    host: 'mockDbHost',
    params: 'mockDbParams',
    pass: 'mockDbPass',
    port: 'mockDbPort',
    protocol: 'mockDbProtocol',
    user: 'mockDbUser',
  },
  protocol: 'http://mockEncode?c=__CODE__',
};

export default mock;
