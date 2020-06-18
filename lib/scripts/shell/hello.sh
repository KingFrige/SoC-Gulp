#!/bin/tcsh  -f

if ($#argv < 1) then
  echo "============="
  echo "Hello, Shell"
  echo "============="
else
  echo ""
  echo "Hello" $argv[1]
  echo ""
endif
