#!/bin/bash

if [[ $0 != $BASH_SOURCE ]]
then
  dirpath=`dirname $BASH_SOURCE`
  abspath=$(cd $dirpath && echo $PWD/${BASH_SOURCE##*/})
  export SULP_ROOT=`dirname $abspath`
  if [ ! $SULP_ROOT ]; then
    export SULP_ROOT=$PWD
  fi

  export PATH=$SULP_ROOT/node_modules/.bin/:$PATH

  if [ $NODE_PATH ];
  then
    export NODE_PATH=$SULP_ROOT/lib:$SULP_ROOT/node_modules:$NODE_PATH
  else
    export NODE_PATH=$SULP_ROOT/lib:$SULP_ROOT/node_modules
  fi

  alias sulp="gulp -f $SULP_ROOT/gulpfile.js"
  echo "====================="
  echo "sulp environment done"
  echo "====================="
fi
