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

import {DesignSysconInterface} from "../protocol/designSysconInterface"

let flow:DesignSysconInterface

gulp.task('designSyscon',()=>{
  return new Promise((resolve)=>{
    if(flow.name != null){
      console.log("designSyscon,", flow.name)
    } else {
      console.log("=================")
      console.log("designSyscon, typescript")
      console.log("=================")
    }
    resolve()
  })
})

module.exports.init = function(program) {
  program.allowUnknownOption()
    .option('-n, --name <args>', 'name')
};

module.exports.flowName='designSyscon'

module.exports.setEnv = function(e) {
  let env = e

  flow = <DesignSysconInterface>env.getFlow('designSyscon');

  flow.name = env.getOpt('designSyscon.name', null)
};
