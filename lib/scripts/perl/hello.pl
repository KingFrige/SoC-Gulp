#!/usr/bin/perl -w
use strict;
use warnings;

if( $#ARGV < 0 ) {
  print("=============\n");
  print("Hello, Perl\n");
  print("=============\n");
} else {
  print("\n");
  print("Hello $ARGV[0] \n");
  print("\n");
}
