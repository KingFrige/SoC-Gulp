gulp flow - interface command
===============
### help
- gulp --helpall

### 命令定义
<> args, must add
[] optional
gulp <v.>:<n.> [parameter]

work_dir --> work.ts dir
run_dir  --> specify | Relative work_dir

profile --> hook env[tool env]

### project
gulp create:proj -n,--name <name>
gulp clean:proj -n,--name <name>
gulp init:proj -n,--name <name>

### verif
#### help
- gulp verif:help

#### project
- gulp add:verifprj -n <name>
- gulp rm:verifprj  -n <name>

#### file
- gulp file:asic [ -s,--step [sim,syn] -p,--process [--rtl | --pre | --post] ]
- gulp file:fpga [ -s,--step [sim|syn] ]

#### testcase
- gulp build:sccase [ --case <testcase> -T,-template <template> ]
- gulp build:cpucase [ --case <testcase> -T,-template <template> ]
- gulp build:sdkcase [ --case <testcase> -T,-template <template> ]
- gulp add:sccase --case <testcase> 
- gulp add:cpucase --case <testcase> 
- gulp add:sdkcase --case <testcase> 

#### sim[asic & fpga]
- gulp vlog:asicsim [--case <testcae> --simulator [nc|vcs] [-T <timeout>] -s,--step [rtl|pre|post] --tech [wc,lt,nosdf,tt] ]
- gulp run:asicsim  [--case <testcase> --simulator [nc|vcs] [-T <timeout>] -s,--step [rtl|pre|post] --tech [wc,lt,nosdf,tt] ]

- gulp vlog:fpgasim [ --case <testcase> --simulator [nc|vcs] [-T <timeout>] [-t <testcase> --step rtl|post] ]
- gulp run:fpgasim  [ --case <testcase> --simulator [nc|vcs] [-T <timeout>] [-t <testcase> --step rtl|post] ]

#### verdi
- gulp open:verdi [ --case <testcase> ]

#### regression
- gulp addto:regression --case <testcase>
- gulp rmfrom:regression --case <testcase>
- gulp list:regression
- gulp run:regression [--file <filelist>]
- gulp rpt:regression 

#### report
- gulp show:caserpt [ --case <testcase> ]

#### doc
- gulp add:casedoc 
- gulp show:casedoc 

#### clean
- gulp clean:sim
- gulp clean:regression

### fpga
#### project
- gulp add:fpgaprj -n,--name <name>
- gulp rm:fpgaprj  -n,--name <name>

#### syn & implemation
- gulp syn:fpga 
- gulp pr:fpga

#### clean
- gulp clean:fpga
