export {};
require('json5/lib/register');
const gulp = require('gulp');
const JSON5 = require('json5');
const fs = require('fs');
const del = require('rimraf');
const _ = require('lodash');
const log = require('fancy-log');
const Path = require('path');
const glob = require('glob')
const mkdirp = require('mkdirp');
const newer = require('gulp-newer')
const through = require('through2')
const Mustache = require('mustache')


let {toPath,getFullPath, runCmdDetached, runCmd} = require('sulp_utils');

import {DesignInterruptInterface} from "../protocol/designInterruptInterface"

let flow:DesignInterruptInterface

gulp.task('designInterrupt',()=>{
  return new Promise((resolve)=>{
    if(flow.name != null){
      console.log("designInterrupt,", flow.name)
    } else {
      console.log("=================")
      console.log("designInterrupt, typescript")
      console.log("=================")
    }
    resolve()
  })
})

module.exports.init = function(program) {
  program.allowUnknownOption()
    .option('-n, --name <args>', 'name')
};

module.exports.flowName='designInterrupt'

module.exports.setEnv = function(e) {
  let env = e

  flow = <DesignInterruptInterface>env.getFlow('designInterrupt');

  flow.name = env.getOpt('designInterrupt.name', null)
};
