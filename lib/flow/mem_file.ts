export {}
require('json5/lib/register')
const gulp = require('gulp')
const JSON5 = require('json5')
const fs = require('fs')
const del = require('rimraf')
const _ = require('lodash')
const log = require('fancy-log')
const Path = require('path')
const glob = require('glob')
const mkdirp = require('mkdirp')
const newer = require('gulp-newer')
const through = require('through2')
const Mustache = require('mustache')


let {toPath,getFullPath, runCmdDetached, runCmd} = require('sulp_utils')

import {MemFileInterface} from "../protocol/memFileInterface"

let flow:MemFileInterface

gulp.task('gen:mem',()=>{
  return new Promise((resolve)=>{
    resolve()
  })
})

module.exports.init = function(program) {
  program.allowUnknownOption()
    .option('-w, --workDir <args>', 'specify work dir')
    .option('-m, --modulePath <args>', 'specify module name')
}

module.exports.flowName='memFile'

module.exports.setEnv = function(e) {
  let env = e

  flow = <MemFileInterface>env.getFlow('memFile')
  flow.projectDir = env.getOpt('global.projectDir', null)
  flow.workDir    = env.flow.global.workDir
  flow.rtlRootDir = env.getOpt('global.rtlRootDir', null)
  flow.modulePath = env.getOpt('memFile.modulePath', null)
}
