#!/bin/bash

# please set $SULP_ROOT
# export SULP_ROOT=$PWD

if [ ! $SULP_ROOT ]; then
  export SULP_ROOT=$PWD
fi

export PATH=$SULP_ROOT/node_modules/.bin/:$PATH

if [ $var ];
then
  export NODE_PATH=$SULP_ROOT/lib:$SULP_ROOT/node_modules:$NODE_PATH
else
  export NODE_PATH=$SULP_ROOT/lib:$SULP_ROOT/node_modules
fi

alias sulp="gulp -f $SULP_ROOT/gulpfile.js"
