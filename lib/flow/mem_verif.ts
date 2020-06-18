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

import {MEMVerifInterface} from "../protocol/memVerifInterface"

let flow:MEMVerifInterface


gulp.task('setup:memVerif',()=>{
  return new Promise((resolve)=>{
    resolve()
  })
})


module.exports.init = function(program) {
  program.allowUnknownOption()
    .option('-n, --name <args>', 'name')
};

module.exports.flowName='memVerif'

module.exports.setEnv = function(e) {
  let env = e

  flow = <MEMVerifInterface>env.getFlow('memVerif');

  flow.name   = env.getOpt('memVerif.name', null)
};
