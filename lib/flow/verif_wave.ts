export {}
require('json5/lib/register')
const gulp  = require('gulp')
const JSON5 = require('json5')
const fs  = require('fs')
const del = require('rimraf')
const _   = require('lodash')
const log = require('fancy-log')
const Path = require('path')
const glob = require('glob')
const mkdirp = require('mkdirp')
const newer  = require('gulp-newer')
const through  = require('through2')
const Mustache = require('mustache')

let {toPath, getFullPath, runCmdDetached, runCmd, buidTarget} = require('sulp_utils')

import {VerifWaveInterface} from "../protocol/verifWaveInterface"

let flow:VerifWaveInterface

function verdiCompilePlan(flistFile:string, verdiRunDir:string){
  let ret = []

  console.log("verdiRunDir =", verdiRunDir)

  ret.push('-sv')
  ret.push('-syntaxerrormax 10000')
  ret.push('-sverilog -ntb -full64')
  ret.push('+libext+.v+.V')
  ret.push('+warn=noBCNACMBP +warn=noTFIPC +warn=noFCWAIEW')
  ret.push("-f")
  ret.push(flistFile)

  return {
    cmd: '/eda_tools/synopsys/verdi/201606/bin/vericom',
    args: ret,
    cdw: verdiRunDir
  }
}

function verdiDirectLoad(flistFile:string, verdiRunDir:string, benchTopName:string, plusArgs:string, loadWaveFile:boolean){
  var ref

  var ret = []
  ret.push('-syntaxerrormax 10000')
  ret.push('-sv')

  let plusArgsList
  if(plusArgs != null && (plusArgs.length != 0)){
    plusArgsList = plusArgs.split(/,/) 
    ret.push(...plusArgsList)
  }

  ret.push("-f")
  ret.push(flistFile)
  ret.push("-top")
  ret.push(benchTopName)

  if (loadWaveFile) {
    let fsdbList = glob.sync(verdiRunDir + '/*.fsdb')
    if (fsdbList.length > 0) {
      ret.push("-ssf")
      ret.push(fsdbList[0])
    }
  }

  let argsFile = Path.resolve(verdiRunDir + '/verdi_load.args')
  fs.writeFileSync(argsFile, ret.join(" "), 'utf8')

  return {
    cmd: 'verdi',
    args: ret,
    cdw: verdiRunDir
  }
}

function devLoad(){
  console.log("DEV load!")
}
function simvisionLoad(){
  console.log("simvision load!")
}

gulp.task("verdi:comp", () => {
  let ret
  // let verdiRunDir = toPath(flow.workDir,'build/verdi')
  let verdiRunDir = flow.buildDir

  if (flow.isRebuild){
    del.sync(verdiRunDir)
  }
  if (!fs.existsSync(verdiRunDir)) {
    mkdirp.sync(verdiRunDir)
  } 

  process.chdir(verdiRunDir)
  ret = verdiCompilePlan(flow.chipTargetFlistFile, verdiRunDir)
  return runCmd(ret.cmd, ret.args, ret.cwd)
})

gulp.task("verdi:load", () => {
  let ret = []
  // let verdiRunDir = toPath(flow.workDir,'build/verdi')
  let verdiRunDir = flow.buildDir

  if (!fs.existsSync(verdiRunDir)) {
    console.log("Please run: sulp verdi:comp")
  } 

  ret.push('-sv')
  ret.push('-lib')
  ret.push('work')
  ret.push("-top")
  ret.push(flow.benchTopName)

  if (flow.loadWaveFile) {
    let fsdbList = glob.sync(verdiRunDir + '/*.fsdb')
    if (fsdbList.length > 0) {
      ret.push("-ssf")
      ret.push(fsdbList[0])
    }
  }

  return runCmd('verdi', ret, verdiRunDir)
})

// gulp.task('wave:load', gulp.series('build:flist', ()=> {
gulp.task('load:wave', ()=> {
  var ret

  // let verdiRunDir = toPath(flow.workDir,'build/verdi')
  let verdiRunDir = flow.buildDir
  if (!fs.existsSync(verdiRunDir)) {
    mkdirp.sync(verdiRunDir)
  } 

  process.chdir(verdiRunDir)

  let plusArgs = flow.waveLoadArgs

  if(flow.waveTool == 'verdi'){
    ret = verdiDirectLoad(flow.chipTargetFlistFile, verdiRunDir, flow.benchTopName, plusArgs, flow.loadWaveFile)
  } else if(flow.waveTool == 'dve') {
    // ret = devLoad()
  } else if(flow.waveTool == 'simvision'){
    // ret = simvisionLoad()
  }

  return runCmd(ret.cmd, ret.args, ret.cwd)
})
// )

module.exports.init = function(program) {
  program.allowUnknownOption()
    .option('--tool [verdi|dev|simvision]', 'specify trace tool')
    .option('-c,--case <arg>', 'specify testcase dir')
    .option('--force', 'vericom rebuild flist')
    .option('--flist <args>', 'specify flist file')
    .option('--loadargs <args>', 'specify flist file')
}

module.exports.flowName = 'wave'

module.exports.setEnv = function(e) {
  let env = e
  flow = <VerifWaveInterface>env.getFlow('wave')

  flow.workDir = env.flow.global.workDir

  let simBuildDir = env.getOpt('sim.simBuildDir', null)
  flow.buildDir = simBuildDir

  flow.chipTargetFlistFile = env.getOpt('sim.chipTargetFlistFile', null)
  flow.benchTopName = env.getOpt('global.benchTopName', null)

  let waveLoadArgs = env.getOpt('wave.loadargs', '')
  if(waveLoadArgs != ''){
    flow.waveLoadArgs = waveLoadArgs + ' ' + env.getOpt('sim.groupArgs', '')
  } else {
    flow.waveLoadArgs = env.getOpt('sim.groupArgs', '')
  }

  flow.loadWaveFile = env.getOpt('wave.loadWaveFile', true)
  flow.waveTool     = env.getOpt('wave.wavetool', 'verdi')

  flow.isRebuild    = env.getOpt('wave.force', false)
}
