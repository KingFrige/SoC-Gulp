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

import {SignoffReportInterface} from "../protocol/signoffReportInterface"

let flow:SignoffReportInterface

gulp.task('report:PT',()=>{
  return new Promise((resolve)=>{
    resolve()
  })
})

gulp.task('report:FM',()=>{
  return new Promise((resolve)=>{
    resolve()
  })
})

gulp.task('report:spyglass',()=>{
  return new Promise((resolve)=>{
    resolve()
  })
})

gulp.task('report:signoff', gulp.series('report:PT' , 'report:FM' , 'report:spyglass', ()=>{
  return new Promise((resolve)=>{
    resolve()
  })
}))


module.exports.init = function(program) {
  program.allowUnknownOption()
    .option('-n, --name <args>', 'name')
};

module.exports.flowName='signoffReport'

module.exports.setEnv = function(e) {
  let env = e

  flow = <SignoffReportInterface>env.getFlow('signoffReport');

  flow.name   = env.getOpt('signoffReport.name', null)
};
