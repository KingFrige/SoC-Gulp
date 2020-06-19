#!/bin/tcsh 

# please set $SULP_ROOT
# setenv SULP_ROOT $PWD
# echo $SULP_ROOT

if(!($?SULP_ROOT)) then
  setenv SULP_ROOT $PWD
endif

setenv PATH $SULP_ROOT/node_modules/.bin/:$PATH

if (! $?var) then
  setenv NODE_PATH  $SULP_ROOT/lib:$SULP_ROOT/node_modules
else
  setenv NODE_PATH  $SULP_ROOT/lib:$SULP_ROOT/node_modules:$NODE_PATH
endif

alias sulp "gulp -f $SULP_ROOT/gulpfile.js"
