#!/usr/bin/env bash
# set -e

if [ "$1" = 'dev' ]
then

    yarn install
    yarn run serve:dev

elif [ "$1" = 'test' ]
then

    yarn run test

elif [ "$1" = 'prod' ]
then

    yarn run serve:prod

else

    exec "$@"

fi