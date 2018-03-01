#!/usr/bin/env bash
# set -e

GIT_SUBMODULE_FILE=.git

if [[ -f $GIT_SUBMODULE_FILE ]]; then
    mv $GIT_SUBMODULE_FILE __$GIT_SUBMODULE_FILE
fi

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

if [[ -f __$GIT_SUBMODULE_FILE ]]; then
    mv __$GIT_SUBMODULE_FILE $GIT_SUBMODULE_FILE
fi