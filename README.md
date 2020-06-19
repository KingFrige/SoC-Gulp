SoC-Gulp
========
This repository contains SoC build flow, such as git/verif/asic/mem/fpga...


### How to Quick verif

#### install Verilg-Perl
```
git clone http://git.veripool.org/git/Verilog-Perl  # Only first time
cd Verilog-Perl
git checkout master   
git pull origin master  

perl Makefile.PL
make
make test
make install
```

#### install [NodeJS & npm](https://nodejs.org/en/download/)

#### Checkout The Code
```
$ git clone https://gitee.com/korbenyuan/SoC-Gulp.git SoC-Gulp
$ cd SoC-Gulp

$ npm install

$ source sourceme.csh
$ cd ..
```

#### Build The Project
```
# initial project
$ sulp init:project -p test_demo

$ cd test_demo
$ source sourceme.csh
$ cd toolchain/SoC-Gulp && npm install

$ cd test_demo
$ sulp init:repo

$ cd verif/demo/testcase/test

# set EDA tools

$ sulp run:vsim
$ sulp load:wave
```


### Directory structure
<pre>
.
├── envInterface.ts    // env interface schema
├── env.ts             // top environment script
├── gulpfile.js        // gulp loader script
├── lib
│   ├── flow           // flow directory
│   ├── profile        // profile directory
│   ├── protocol
│   └── sulp_utils.ts        // utility functions
├── node_modules             // node modules install directory
├── package.json             // node configuration json file
├── sourceme.csh             // csh sourceme
├── sourceme.sh              // bash sourceme
└── tsconfig.json            // typescript compile config

</pre>

### how to work

1. current directory is work directory, if you want to specify the other location, use --workDir <directory name>

2. sulp load work.[json5|json|ts|coffee] in your work directory, work file will return a object like this:

<pre>
  {
    global: {              // global configuration
      overwrite: true      // if you want to overwrite the default flow
      use_flow: [
        {flow:require('flow/verif_sim.ts')},   // use public flow in lib
        {flow:require('./web_shell.ts')},      // use own flow in current directory
        ],
    },
    simple: {             // simple flow default configuration
      run_dir: __dirname
    },
  },
</pre>

3.  
 flow is a job list independent with specify tool, flow protocol will define the data structure about the job.

  profile is the function to do the flow job with specify tool, the profile function input is the flow data  structur, the output is command and arguments. 
  
  flow job will call runCmd or runcmdDetached to spawn the job. 
  * runCmd function do the fix time return job such as copy,link,execute the simple script. 
  * runCmdDetached do the uncertainted time job such as simulation/layout job. runCmdDeatched will redirect the stdout/in to readline instance. user can use Ctrl-C to interrup the job and control the tool shell.

4. flow module structure sample which named 'foo'

<pre>
export {};                         // isolate the namespace
require('json5/lib/register')      // require the module needed
const gulp     = require('gulp')
....
import {fooInterface} from "../protocol/FooInterface" // import the flow data structure interface

let flow:fooInterface// declare the flow scope data structure 
let profile:any       // declare the profile variable if needed
....
// local function definition
// gulp task definition
...

module.exports.flowName = 'foo'  // export the flow name, must exist

module.exports.init = ()=>{  // command line arguments definition, must exist 
  program.allowUnknownOption()
    .option('--option <number>') // the option can be find in env.getOpt('foo.option')

module.exports.setEnv = (env)=>{ // fullfill flow data structure, must exist
                                 // env is the top structure include 
                                 // the all flow and global
  profile=env.useProfile('foo')  // instance the profile
  flow = <fooInterface>env.getFlow('foo');  // create the flow data structure instance
  flow.aaa = env.flow.other.bbb    // fullfill the flow data structure
  flow.bbb = env.getOpt('foo.option')
}
</pre>

5. profile module structure sample 

  the profile is not only one-to-one with flow, the recommend usage is one flow only correspond to one profile.
  one profile can support multi flow, for example
simulation/wave can correspond the same tool ius15.2, so this profile will be
used in simulation flow and wave flow

<pre>
export {};                         // isolate the namespace
require('json5/lib/register')      // require the module needed
const gulp     = require('gulp')
....
import {fooInterface} from "../protocol/FooInterface" // import the flow data structure interface
import {barInterface} from "../protocol/BarInterface" // import the flow data structure interface

let fooFlow:fooInterface
let barFlow:barInterface

module.exports = {
  setFlow: (flow) {     // interface function must exist
    fooFlow = flow.foo;
    barFlow = flow.bar;
  },
  compile: function(args) {
    // do somthing
    return {         // return the data structure for runCmd and runCmdDeatched
      cmd: 'command',
      args: [arg1,arg2,arg3....],
      cwd: './run_dir'
    };
  }
</pre>


