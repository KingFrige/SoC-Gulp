#!/bin/csh -f

# please set $SULP_ROOT
# setenv SULP_ROOT $PWD
# echo $SULP_ROOT

set called=($_)
set script_fn=`readlink -f $called[2]`
set script_dir = `dirname "$script_fn"`

setenv SULP_ROOT $script_dir

setenv PATH $SULP_ROOT/node_modules/.bin/:$PATH

if (! $?NODE_PATH) then
  setenv NODE_PATH  $SULP_ROOT/lib:$SULP_ROOT/node_modules
else
  setenv NODE_PATH  $SULP_ROOT/lib:$SULP_ROOT/node_modules:$NODE_PATH
endif

alias sulp "gulp -f $SULP_ROOT/gulpfile.js"
echo "====================="
echo "sulp environment done"
echo "====================="
