gulp flow - interface command
===============

### 命令定义
#### help
- gulp help

#### add
- gulp add --help
- gulp add --case
- gulp add --cpucase
- gulp add --project
- gulp add --work

#### c/lib compile
- gulp compile --clib
- gulp compile --model-case
- gulp compile --cpu-case

- gulp compile [--all]

#### rtl sim
- gulp build --rtl
- gulp vlog --vcs [-T \<timeout\>] [-t \<testcase\>] [--rtl]
- gulp vlog [--nc]  [-T \<timeout\>] [-t \<testcase\>] [--rtl]
- gulp sim  --vcs [-T \<timeout\>] [-t \<testcase\>] [--rtl]
- gulp sim  [--nc]  [-T \<timeout\>] [-t \<testcase\>] [--rtl]


- gulp build --gate
- gulp vlog --vcs [-T \<timeout\>] [-t \<testcase\>] --pre
- gulp vlog [--nc]  [-T \<timeout\>] [-t \<testcase\>] --pre
- gulp sim  --vcs [-T \<timeout\>] [-t \<testcase\>] --pre
- gulp sim  [--nc]  [-T \<timeout\>] [-t \<testcase\>] --pre

- gulp vlog --vcs [-T \<timeout\>] [-t \<testcase\>] --post -tp \<wc,lt,tt\>
- gulp vlog [--nc]  [-T \<timeout\>] [-t \<testcase\>] --post -tp \<wc,lt,tt\>
- gulp sim  --vcs [-T \<timeout\>] [-t \<testcase\>] --post -tp \<wc,lt,tt\>
- gulp sim  [--nc]  [-T \<timeout\>] [-t \<testcase\>] --post -tp \<wc,lt,tt\>

#### verdi
- gulp verdi

#### regression
- gulp regression --task

- gulp regression --add \<testcase\>
- gulp regression --delete \<testcase\>
- gulp regression --status \<testcase\>
- gulp regression --list \<dirlist\> [--pre]
- gulp regression --list \<dirlist\> --post -tp \<wc,lt,tt\>
- gulp regression --status
- gulp regression --rpt

#### report
- gulp rpt --list \<dirlist\>
- gulp rpt --ls
- gulp rpt --list \<dirlist\> --show \<error\>
- gulp rpt --regression


#### doc
- gulp doc --add 
- gulp doc --show
- gulp doc --update

#### clean
- gulp clean [--all]
- gulp clean --compile
- gulp clean --sim
- gulp clean --rpt
- gulp clean --regression


#### testplan
- gulp testplan --add



