#!/usr/bin/env bash
# set -e

function install_deps {
    GIT_SUBMODULE_FILE=.git

    if [[ -f $GIT_SUBMODULE_FILE ]]; then
        mv $GIT_SUBMODULE_FILE __$GIT_SUBMODULE_FILE
    fi

    yarn install

    if [[ -f __$GIT_SUBMODULE_FILE ]]; then
        mv __$GIT_SUBMODULE_FILE $GIT_SUBMODULE_FILE
    fi

}

if [ "$1" = 'dev' ]
then

    install_deps
    yarn run serve:dev

elif [ "$1" = 'test' ]
then

    install_deps
    yarn run test:watch

elif [ "$1" = 'coverage' ]
then

    install_deps
    yarn run coverage

elif [ "$1" = 'lint' ]
then

    install_deps
    yarn run lint:fix
    
elif [ "$1" = 'prod' ]
then

    yarn run serve:prod

else

    exec "$@"

fi
