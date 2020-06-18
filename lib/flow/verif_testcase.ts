export {}
require('json5/lib/register')
const gulp = require('gulp')
const JSON5 = require('json5')
const fs = require('fs')
const del = require('rimraf')
const _ = require('lodash')
const log = require('fancy-log')
const Path = require('path')
const glob=require('glob')
const newer = require('gulp-newer')
const through = require('through2')
const mkdirp = require('mkdirp')
const Mustache = require('mustache')

let {toPath,getFullPath, runCmdDetached, runCmd, buildTarget, delBuildDirAndFile, templateFileGen} = require('sulp_utils')

import {VerifTestcaseInterface} from "../protocol/verifTestcaseInterface"

let flow:VerifTestcaseInterface
let simProfile = null

gulp.task('_compileSCCase', () => {
  return new Promise((resolve)=>{
    console.log("compile sccase")
    resolve()
  })
})

gulp.task('_linkSCCase', gulp.series('_compileSCCase', () => {
  return new Promise((resolve)=>{
    console.log("link sccase")
    resolve()
  })
}))

gulp.task('build:sccase', gulp.series('_linkSCCase', () => {
  return new Promise((resolve)=>{
    console.log("Congratulation! SC case build success!")
    resolve()
  })
}))

gulp.task('build:cpucode', () => {
  return new Promise((resolve)=>{
    console.log("build cpu code")
    resolve()
  })
})

gulp.task('build:cpucase', gulp.series('build:sccase', 'build:cpucode', () => {
  return new Promise((resolve)=>{
    console.log("Congratulation! cpu case build success!")
    resolve()
  })
}))

gulp.task('build:sdkcase', gulp.series('build:sccase', () => {
  console.log("Congratulation! sdk case of cpu build success!")
}))

gulp.task('add:sccase', () => {
  return new Promise((resolve)=>{
    console.log("add SC case Finished")
    resolve()
  })
})

gulp.task('add:cpucase', gulp.series('add:sccase', () => {
  return new Promise((resolve)=>{
    console.log("add cpu case Finished")
    resolve()
  })
}))

gulp.task('add:sdkcase', () => {
  console.log("add sdk case of cpu is OK!") 
})

gulp.task('clean:sccase', () => {
})

gulp.task('clean:cpucase', gulp.series( 'clean:sccase', () => {
}))

gulp.task('clean:case', gulp.series('clean:sccase', 'clean:cpucase', () => {
  return new Promise(function(resolve) {
    return resolve(1) 
  })
}))

module.exports.init = function(program) {
  program.allowUnknownOption()
    .option('-c,--case <args>', 'specify testcase dir')
    .option('-w,--workDir <args>', 'specify work dir')
    .option('--force', 'delect old data, and rebuild')
}

module.exports.flowName='testcase'

module.exports.setEnv = function(e) {
  let env = e

  flow = <VerifTestcaseInterface>env.getFlow('testcase')

  flow.verifWorkDir   = env.getOpt('global.verifWorkDir', null)
  flow.verifWorkName  = env.getOpt('global.verifWorkName', null)
  flow.benchTopName   = env.getOpt('global.benchTopName', null)

  flow.case  = env.getOpt('testcase.case', null)
  let workDir       = env.getOpt('testcase.workDir')
  if((workDir != null) && (flow.case != null)){
    flow.workDir = env.flow.global.workDir
    flow.caseDir = getFullPath(process.env.PWD, flow.case)
  } else {
    flow.workDir  = env.flow.global.workDir
    flow.caseDir = getFullPath(flow.workDir, env.getOpt('testcase.case', flow.workDir))
  }
  const caseName = Path.basename(flow.caseDir)
  const caseRelativeWorkDirPath = flow.caseDir.split('/').slice(flow.workDir.split('/').length).join('/')

  let isFreeDir = env.getOpt('testcase.isFreeDir', false)
  let caseBuildDir = env.getOpt('testcase.caseBuildDir', null)
  if(isFreeDir && (caseBuildDir != null)) {
    flow.caseBuildDir =getFullPath(flow.workDir, caseBuildDir)
  } else {
    if(caseBuildDir != null){
      flow.caseBuildDir = toPath(getFullPath(flow.workDir, caseBuildDir), "sccase",caseRelativeWorkDirPath)
    } else if(flow.case != null){
      flow.caseBuildDir = toPath(flow.workDir, 'localBuild', 'sccase', caseRelativeWorkDirPath)
    } else {
      // case dir is workDir
      flow.caseBuildDir = toPath(flow.workDir, 'build/sccase') 
    }
  }

  flow.caseTemplate = env.getOpt('testcase.template', null)

  let iusInstallDir = env.getOpt('sim.iusInstallDir', process.env.CDS_INST_DIR)
  if(iusInstallDir){
    flow.iusInstallDir = iusInstallDir
  } else {
    console.error("ERROR: Please set simulation Install directory!")
    process.exit()
  }

  flow.cpuSrcDir = env.getOpt('testcase.cpuSrcDir', 'cpu_src')

  flow.jsonIncDir=env.getOpt('sim.jsonIncDir', '/usr/include/jsoncpp')

  flow.purgeAll = env.getOpt('sim.purgeAll', false)

  flow.isRebuild    = (env.getOpt('testcase.force') != null) ? true : false

  simProfile = env.useProfile('sim')
  simProfile.simPlan.simArgs.setCaseDir(flow.caseDir)
  simProfile.simPlan.simArgs.setCaseBuildDir(flow.caseBuildDir)
}
