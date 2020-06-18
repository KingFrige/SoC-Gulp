SoC-Gulp
==========

### 原则&目标
* 简单，易于部署
* 易于构建flow
* 静态化，设计与sulp无关，每一步的输出都可以被其他工具介入
* 插件化，易于扩展
* 发挥gulp task的优势: 分割组合task/创建替换task.....
* 统一的flow规范
* 报告rpt做独立收集
* 规范file flow中的导入的设计文件
* 以IP为设计中心的flow    


### Flow - 规范
- file       - 归档
- run/build  - 执行的flow任务
- report     - 收集报告，生成信息
- regression - 生成run/build与report的pattern


### Flow 空间概念
- work 存在project之下，包含自己的配置文件work.ts
- project 存放多个work


### default -> 手脚架工具
- init
- new:verif
- new:asic
- new:fpga

### git
- git_file

### vpp
- vpp_file
- vpp_run

### verif
- verif_file
- verif_case
- verif_scSuit
- verif_uvm
- verif_sim
- verif_report
- verif_regression
- verif_wave

### asic
- asic_file
- asic_constrain
- asic_syn
- asic_report
- asic_regression
- asic_view --> start_gui

### fpga
- fpga_file
- fpga_constrain
- fpga_syn
- fpga_imp
- fpga_report
- fpga_regression
- fpga_view --> start_gui

### mem
- mem_file
- mem_verif
- mem_report
- mem_regression

### signoff
- signoff_file
- signoff_spyglass
- signoff_pt 
- signoff_fm
- signoff_report
- signoff_regression

### ci
- ci_file
- ci_run
- ci_report
