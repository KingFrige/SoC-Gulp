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

import {DesignDummyInterface} from "../protocol/designDummyInterface"

let flow:DesignDummyInterface

gulp.task('_dummyModule',()=>{
  const moduleDir = flow.moduleDir
  const moduleInfoFile = toPath(moduleDir, 'module_info.json5')
  const moduleInfoList = require(moduleInfoFile)
  const topModule = moduleInfoList.topModule

  const vppOutFile = toPath(flow.vppBuildDir, topModule + '.all.v')
  console.log("topModule = ", topModule)
  console.log("vppOutFile = ", vppOutFile)
  return new Promise((resolve)=>{
    resolve()
  })
})

gulp.task('dummy:module', gulp.series('vpp:module', '_dummyModule'))

module.exports.init = function(program) {
  program.allowUnknownOption()
    .option('-w,--workDir <args>', 'specify work dir')
    .option('-m,--moduleDir <args>', 'specify module dir')
    .option('--force', 'delect old data, and rebuild')
}

module.exports.flowName='designDummy'

module.exports.setEnv = function(e) {
  let env = e

  flow = <DesignDummyInterface>env.getFlow('designDummy')
  const moduleDir = env.getOpt('designDummy.moduleDir', null)
  const workDir   = env.getOpt('designDummy.workDir', null)
  if((workDir != null) && (flow.moduleDir != null)){
    flow.workDir = workDir
    flow.moduleDir = getFullPath(process.env.PWD, flow.moduleDir)
  } else {
    flow.workDir = env.flow.global.workDir
    flow.moduleDir = getFullPath(flow.workDir, env.getOpt('designDummy.moduleDir', flow.workDir))
  }

  flow.vppBuildDir = toPath(flow.moduleDir, 'build/rtl_export')
  flow.dummyBuildDir = toPath(flow.moduleDir, 'build/dummy')

  flow.isRebuild   = (env.getOpt('designDummy.force') != null) ? true : false
}
