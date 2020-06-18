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


let {toPath,getFullPath, runCmdDetached, runCmd, delBuildDirAndFile} = require('sulp_utils')
let {findWorkJson} = require('../../env.ts')

import {VerifRegressionInterface} from "../protocol/verifRegressionInterface"

let flow:VerifRegressionInterface

gulp.task('setup:simRegression',()=>{
  const currentWorkCaseConfigList = glob.sync(`${toPath(flow.workDir, "**/config.js")}`)
  const regressionList = []

  const regressionScriptFile = toPath(flow.workDir, 'regression_run_sim.csh')
  fs.writeFileSync(regressionScriptFile, '#!/bin/tcsh -f\n\n', 'utf8')
  const chipProjectDir = process.env.CHIP_PROJECT_DIR
  fs.appendFileSync(regressionScriptFile, 'cd '+ chipProjectDir + '\n', 'utf8')
  fs.appendFileSync(regressionScriptFile, 'source sourceme.csh' + '\n', 'utf8')
  fs.appendFileSync(regressionScriptFile, 'cd '+ flow.workDir + '\n\n\n', 'utf8')


  let caseAttrList = {}
  _.map(currentWorkCaseConfigList, function(caseConfigPath){
    let caseConfig = require(caseConfigPath)
    let caseDir = Path.dirname(caseConfigPath)

    caseAttrList[Path.resolve(caseDir)] = {
      caseDir: Path.resolve(caseDir),
      caseType: caseConfig.caseType,
      hasRegression: caseConfig.hasRegression
    }
  })

  let simType = 'run'
  if(flow.techType == 'fpga'){
    simType = 'runfpga'
  } else {
    simType = 'run'
  }

  _.map(caseAttrList, function(casePath){
    let   caseDir =  casePath.caseDir
    const caseType =  casePath.caseType
    const hasRegression = casePath.hasRegression
    let regressionLine = ''
    if(hasRegression != false){
      const workJsonFile = findWorkJson(caseDir.split(/\//))
      const workJsonDir = Path.dirname(workJsonFile)
      // console.log('workJsonFile = ', workJsonFile)
      
      if(caseType == 'cpucase'){
        regressionLine    ='sulp ' + simType +':cpusim --case ' + caseDir
      } else if(caseType == 'sccase'){
        regressionLine    ='sulp ' + simType +':sim --case ' + caseDir
      } else {
        console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>")
        console.log("Please config " + caseDir +"/config.js, add caseType")
        console.log("<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<")
        return
      }

      if(flow.regressionType == 'work'){
        regressionLine   += ' \\\n             --workDir ' + workJsonDir
        if(flow.elabBuildDir){
          regressionLine += ' \\\n             --elabBuildDir ' + flow.elabBuildDir
        }
        if(flow.simBuildDir){
          regressionLine += ' \\\n             --simBuildDir ' + flow.simBuildDir
        }
        if(flow.caseBuildDir){
          regressionLine += ' \\\n             --caseBuildDir ' + flow.caseBuildDir
        }
      }

      if(!flow.isDumpWave){
        regressionLine += ' \\\n             --isNotDumpWave '
      }
      if(!flow.nostdout){
        regressionLine += ' \\\n             --quiet '
      }
      console.log(regressionLine + '\n')
      regressionList.push(regressionLine)
      regressionList.push('\n')
    }
  })

  fs.appendFileSync(regressionScriptFile, regressionList.join('\n'), 'utf8')
  fs.appendFileSync(regressionScriptFile,'\n\n\n', 'utf8')

  const args = []
  args.push('+x')
  args.push(regressionScriptFile)
  runCmd('chmod', args)

  return new Promise((resolve)=>{
    console.log("-------------------------")
    console.log("write regression script: ")
    console.log(regressionScriptFile)
    console.log("-------------------------")

    if(flow.runRegression){
      console.log("start run regression script => ", regressionScriptFile)
      const runRegressionArgs = []
      runRegressionArgs.push(regressionScriptFile)
      runCmd('tcsh', runRegressionArgs)
    } else {
      console.log("Please check regression script.")
    }
    resolve()
  })
})

gulp.task('setup:rptRegression',()=>{
  const currentWorkCaseConfigList = glob.sync(`${toPath(flow.workDir, "**/config.js")}`)
  const regressionList = []

  const regressionScriptFile = toPath(flow.workDir, 'regression_run_rpt.csh')
  fs.writeFileSync(regressionScriptFile, '#!/bin/tcsh -f\n\n', 'utf8')
  const chipProjectDir = process.env.CHIP_PROJECT_DIR
  fs.appendFileSync(regressionScriptFile, 'cd '+ chipProjectDir + '\n', 'utf8')
  fs.appendFileSync(regressionScriptFile, 'source sourceme.csh' + '\n', 'utf8')
  fs.appendFileSync(regressionScriptFile, 'cd '+ flow.workDir + '\n\n\n', 'utf8')


  let caseAttrList = {}
  _.map(currentWorkCaseConfigList, function(caseConfigPath){
    let caseConfig = require(caseConfigPath)
    let caseDir = Path.dirname(caseConfigPath)

    caseAttrList[Path.resolve(caseDir)] = {
      caseDir: Path.resolve(caseDir),
      caseType: caseConfig.caseType,
      hasRegression: caseConfig.hasRegression
    }
  })

  _.map(caseAttrList, function(casePath){
    let   caseDir =  casePath.caseDir
    const caseType =  casePath.caseType
    const hasRegression = casePath.hasRegression
    let regressionLine = ''

    // console.log('hasRegression = ', hasRegression)
    if((hasRegression != false) && (typeof(hasRegression) != "undefined") && (typeof(caseType) != "undefined")){
      const workJsonFile = findWorkJson(caseDir.split(/\//))
      const workJsonDir = Path.dirname(workJsonFile)
      // console.log('workJsonFile = ', workJsonFile)

      if(flow.reportType == 'rptsim'){
        if(caseType == 'cpucase'){
          regressionLine   = 'sulp report:cpusim --case ' + caseDir
        } else {
          regressionLine   = 'sulp report:sim --case ' + caseDir
        }
      } else if(flow.reportType == 'rptlog'){
        regressionLine   = 'sulp report:log --case ' + caseDir
      } else {
        regressionLine   = 'sulp report:log --case ' + caseDir
      }

      if(flow.regressionType == 'work'){
        regressionLine  += ' \\\n                --workDir ' + workJsonDir
      }
      if(flow.reportOutputDir){
        regressionLine  += ' \\\n                --rptOutputDir ' + flow.reportOutputDir
      }
      console.log('\n' + regressionLine + '\n')
      regressionList.push(regressionLine)
      regressionList.push('\n')
    }
  })

  fs.appendFileSync(regressionScriptFile, regressionList.join('\n'), 'utf8')
  fs.appendFileSync(regressionScriptFile,'\n\n\n', 'utf8')

  const args = []
  args.push('+x')
  args.push(regressionScriptFile)
  runCmd('chmod', args)

  return new Promise((resolve)=>{
    console.log("-------------------------")
    console.log("write regression script: ")
    console.log(regressionScriptFile)
    console.log("-------------------------")

    if(flow.runRegression){
      console.log("start run regression script => ", regressionScriptFile)
      const runRegressionArgs = []
      runRegressionArgs.push(regressionScriptFile)
      runCmd('tcsh', runRegressionArgs)
    } else {
      console.log("Please check regression script.")
    }
    resolve()
  })
})

gulp.task('show:rptRegression',()=>{
})

gulp.task('clean:regression', () => {
  const simRegressionScriptFile = toPath(flow.workDir, 'regression_run_sim.csh')
  const rptRegressionScriptFile = toPath(flow.workDir, 'regression_run_rpt.csh')

  return new Promise(function(resolve) {
    delBuildDirAndFile(simRegressionScriptFile) 
    delBuildDirAndFile(rptRegressionScriptFile) 
    delBuildDirAndFile(toPath(flow.workDir, 'runCmdLogFile.log')) 

    return resolve(1) 
  })
})

module.exports.init = function(program) {
  program.allowUnknownOption()
    .option('-R', 'genarate regresion script, and run')
    .option('-A, --All', 'run all testcase simulation at all workDir')
    .option('--isDumpWave', 'specify dump wave')
    .option('--nostdout', 'quiet run sim')
    .option('--rptlog', 'genarate pattern for report log, default mode')
    .option('--rptsim', 'genarate pattern for report sim')
    .option('--type <args>', 'specify regression type, [cur] -> for local dir, [work] -> for verif project')
    .option('--techType [fpga|asic|rtl]', 'specify tech type --> fpga/asic/rtl')
    .option('--rptOutputDir <args>', 'specify log file placement location dir')
}

module.exports.flowName='regression'

module.exports.setEnv = function(e) {
  let env = e

  flow = <VerifRegressionInterface>env.getFlow('regression')

  flow.verifRootDir = env.getOpt('global.verifRootDir', null)
  flow.workDir = env.flow.global.workDir 

  flow.regressionType = env.getOpt('regression.type', 'current')

  flow.runRegression = env.getOpt('regression.R', false)
  flow.runAll = env.getOpt('regression.runAll', false)
  
  flow.elabBuildDir = env.getOpt('regression.elabBuildDir', null) 
  flow.simBuildDir  = env.getOpt('regression.simBuildDir', null)
  flow.caseBuildDir = env.getOpt('regression.caseBuildDir', null)
  flow.isDumpWave  = env.getOpt('regression.isDumpWave', false)

  if(env.getOpt('regression.rptlog', null)){
    flow.reportType = 'rptlog'
  } else if(env.getOpt('regression.rptsim', null)){
    flow.reportType = 'rptsim'
  } else {
    flow.reportType = ''
  }
  const techType = env.getOpt('regression.techType', null)
  if(techType == 'fpga'){
    flow.techType = 'fpga'
  } else {
    flow.techType = 'asic'
  }

  flow.nostdout = env.getOpt('regression.nostdout', false)

  const reportOutputDir = env.getOpt('regression.rptOutputDir', null)
  if(reportOutputDir != null){
    flow.reportOutputDir = getFullPath(flow.workDir, reportOutputDir)
  } else {
    flow.reportOutputDir = flow.workDir
  }
}
