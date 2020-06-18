SoC-Gulp Quick Start
==========

## origin design file
```
rtl/ips
   - hdl
   - moudle_info.json5
   - mate_info.csv
   - flist.f

config/
├── dir_tree
│   └── dir_tree.xlsx
├── json
│   ├── rtl_config.json5
├── proj_config
│   └── modules_used_in_project.csv
├── rpt
│   └── IP_workitem.rpt
└── template
    ├── meta_protocol.csv
    └── meta_protocol.json
```


### How to initial sulp project
```
> cd <SoC-Gulp> dir
> source sourceme.csh
> cd <Target Project Dir>

# show sulp tasks
> sulp --tasks
# initial project
> sulp init:project -p <projectName>
```

### How to initial submodule
```
> cd <projectName>
# use project's sulp & initial env
> source sourceme.csh

# update config/proj_config/modules_used_in_project.csv
# add your git repo

> sulp init:repo
```

### How to gen flist
```
# gen flist config json
> sulp gen:chipFlConfig

> sulp gen:asicSimdutFl
> sulp gen:asicSyndutFl
> sulp gen:fpgaSyndutFl
> sulp gen:fpgaSimdutFl

# gen dut flist
> sulp gen:dutFl
```

### How to run sim
```
# for verilog/systemverilog sim
sulp run:vsim 

# for scSuit sim
sulp run:sim 

# for cpu sim
sulp run:cpusim 

# for fpga sc sim
sulp runfpga:sim 

# for fpga cpu sim
sulp runfpga:cpusim 
```
