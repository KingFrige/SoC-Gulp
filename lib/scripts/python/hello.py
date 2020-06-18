#!/usr/bin/python
# -*- coding: UTF-8 -*-

import sys

def main():
    """
    Hello
    """
    if len(sys.argv) <= 1:
      print('=============')
      print('Hello, Python')
      print('=============')
    elif len(sys.argv) > 1:
      print('')
      print('Hello, '+sys.argv[1])
      print('')

if __name__ == "__main__":
    main()
