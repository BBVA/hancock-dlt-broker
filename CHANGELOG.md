## [9.1.0] - 2019-04-09
### Changed
- Changed the configuration of providers in a mongo collection.

## [9.0.0] - 2019-03-22
### Changed
- Changed the model for the response of events with kind: transaction, transfer, smart-contract-transaction and smart-contract-event.

## [8.0.3] - 2019-03-21
### Fixed
- Now the broker would try to reconnect to the DLT in case the connection has been lost.

## [8.0.2] - 2019-03-11
### Fixed
- Mined and pending transaction should be received in the same socket for the same address.

## [8.0.1] - 2019-03-11
### Fixed
- Fixed the problem with the unsubscription of contracts.

## [8.0.0] - 2019-03-08
### Added
- Add new states to subscribe.
- Update docs.

## [7.2.0] - 2019-02-22
### Added
- Added new message to unsubscribe to the broker. Also added new unit tests.

## [7.1.1] - 2019-02-20
### Documentation
- Update docs.

## [7.1.0] - 2019-02-08
### Changed
- Refactor in ethereum controller for transaction and contract subscriptions. Also added new unit tests.

## [7.0.2] - 2019-01-28
### Fixed
- Fixed errors in utils db unit tests.

## [7.0.1] - 2019-01-18
### Fixed
- Fixed the problem with the mongo client that did not reconnect after lose the connection.
