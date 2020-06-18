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

import {ASICRegressionInterface} from "../protocol/asicRegressionInterface"

let flow:ASICRegressionInterface

gulp.task('setup:asicSynRegression',()=>{
  return new Promise((resolve)=>{
    resolve()
  })
})

gulp.task('setup:asicRptRegression',()=>{
  return new Promise((resolve)=>{
    resolve()
  })
})

module.exports.init = function(program) {
  program.allowUnknownOption()
    .option('-n, --name <args>', 'name')
};

module.exports.flowName='asicRegression'

module.exports.setEnv = function(e) {
  let env = e

  flow = <ASICRegressionInterface>env.getFlow('asicRegression');

  flow.name   = env.getOpt('asicRegression.name', null)
};
