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

import {SignoffRegressionInterface} from "../protocol/signoffRegressionInterface"

let flow:SignoffRegressionInterface

gulp.task('setup:PTRegression',()=>{
  return new Promise((resolve)=>{
    resolve()
  })
})

gulp.task('setup:FMRegression',()=>{
  return new Promise((resolve)=>{
    resolve()
  })
})

gulp.task('setup:spyglassRegression',()=>{
  return new Promise((resolve)=>{
    resolve()
  })
})

gulp.task('setup:signoffRegression',()=>{
  return new Promise((resolve)=>{
    resolve()
  })
})

module.exports.init = function(program) {
  program.allowUnknownOption()
    .option('-n, --name <args>', 'name')
};

module.exports.flowName='signoffRegression'

module.exports.setEnv = function(e) {
  let env = e

  flow = <SignoffRegressionInterface>env.getFlow('signoffRegression');

  flow.name   = env.getOpt('signoffRegression.name', null)
};
