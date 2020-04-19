gulp flow - interface command
===============
### help
```
gulp --helpall
```

### 命令定义
```
<> args, must add
[] optional
gulp <v.>:<n.>   [parameter]
gulp <tool>:<v.> [parameter]

work_dir --> work.ts dir

profile --> hook env[tool env]
```

### project
```
gulp create:proj -n,--name <name>
gulp clean:proj -n,--name <name>
gulp init:proj -n,--name <name>
```

### verif
#### help
```
gulp verif:help
```

#### project
- add verif project

```
gulp add:verifprj -n <name>
gulp rm:verifprj  -n <name>
```

#### file
- genarate flist 
    * dut  flist [sim|syn|dummy]
    * asic flist
    * fpga flist

```
gulp vpp:component
gulp _genDutFl [sim|syn|dummy]
gulp gen:dutFl

gulp gen:asicFl  [ -p,--process [--rtl | --pre | --post] ]
gulp gen:fpgaFl  [ -s,--step [sim|syn] ]
```

#### scCompile
- build sc testcase
- build sc sim link file
```
gulp _compileSCSuitCaseApi
gulp _linkSCSuitCaseApi
gulp build:scSuitcaseApi

gulp build:scSuitSimLib

gulp clean:scsuit
```

#### testcase
- add testcase
- build testcase

```
gulp _compileSCCase
gulp _linkSCCase

gulp build:sccase [ --case <testcase> -T,-template <template> ]
gulp add:sccase --case <testcase> 

gulp build:cpucase [ --case <testcase> -T,-template <template> ]
gulp add:cpucase --case <testcase> 

gulp build:sdkcase [ --case <testcase> -T,-template <template> ]
gulp add:sdkcase --case <testcase> 
```

#### sim[asic & fpga]
- use simulator to sim: vlog/elab/sim

```
gulp run:elab [--case <testcase>]
gulp run:sim  [--case <testcase>]

gulp runfpga:elab [ --case <testcase>]
gulp runfpga:sim  [ --case <testcase>]
```

#### verdi
- vericom compile rtl
- verdi load flist & fsdb file

```
gulp verdi:comp
gulp verdi:load

gulp load:wave
```

#### regression
- genarate sim list

```
gulp setup:simRegression [-noRun]
gulp setup:rptRegression [-noRun]
```

#### report
```
gulp show:caserpt [ --case <testcase> ]
```

#### doc
```
gulp add:casedoc 
gulp show:casedoc 
```

#### clean
```
gulp clean:sim
gulp clean:regression
```

### backend
```
gulp setup:spglass
gulp setup:lint
gulp setup:fm
gulp setup:pt
gulp setup:syn
gulp setup:pr
```


### fpga
#### project
- add fpga project
```
gulp add:fpgaprj -n,--name <name>
```

#### syn & implemation
```
gulp setup:fpga
gulp create:fpgaIP
gulp build:fpga
```

#### clean
```
gulp clean:fpga
```
