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
const csvtojson= require('csvtojson')
const xlstojson= require('xls-to-json')


let {toPath,getFullPath, runCmdDetached, runCmd} = require('sulp_utils')

import {GitHelperInterface} from "../protocol/gitHelperInterface"

let flow:GitHelperInterface

gulp.task('co:submodule',()=>{
  return new Promise((resolve)=>{
    resolve()
  })
})

module.exports.init = function(program) {
  program.allowUnknownOption()
    .option('-m, --module <args>', 'specify repo path')
}

module.exports.flowName='gitHelper'

module.exports.setEnv = function(e) {
  let env = e

  flow = <GitHelperInterface>env.getFlow('gitHelper')
  flow.projectDir = env.getOpt('global.projectDir', null)
  flow.rtlRootDir = env.getOpt('global.rtlRootDir', null)
}
