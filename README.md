# SoC-Gulp

This repository contains SoC build flow, such as git/verif/asic/mem/fpga...


## How to Quick verif

### Install [Verilg-Perl](https://github.com/veripool/verilog-perl)

### Install [NodeJS & npm](https://nodejs.org/en/download/)

### Checkout The Code
```
$ git clone https://gitee.com/korbenyuan/SoC-Gulp.git SoC-Gulp
$ cd SoC-Gulp

$ npm install

$ source sourceme.csh
$ cd ..
```

### Build The Project
```
# initial project
$ sulp init:project -p test_demo

$ cd test_demo
$ sulp init:repo

$ cd verif/demo/testcase/test

# set EDA tools

$ sulp run:vsim
$ sulp load:wave
```


### TODO
* 支持verilator仿真器
* 支持gtkwave 波形工具
* 支持iverilog仿真器
* 支持yosys
* 支持OpenRoad
