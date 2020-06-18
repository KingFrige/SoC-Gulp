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

import {DesignCLKgenInterface} from "../protocol/designCLKgenInterface"

let flow:DesignCLKgenInterface

gulp.task('designCLKgen',()=>{
  return new Promise((resolve)=>{
    if(flow.name != null){
      console.log("designCLKgen,", flow.name)
    } else {
      console.log("=================")
      console.log("designCLKgen, typescript")
      console.log("=================")
    }
    resolve()
  })
})

module.exports.init = function(program) {
  program.allowUnknownOption()
    .option('-n, --name <args>', 'name')
};

module.exports.flowName='designCLKgen'

module.exports.setEnv = function(e) {
  let env = e

  flow = <DesignCLKgenInterface>env.getFlow('designCLKgen');

  flow.name = env.getOpt('designCLKgen.name', null)
};
