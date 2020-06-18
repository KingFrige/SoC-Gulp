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

import {ASICSynInterface} from "../protocol/asicSynInterface"

let flow:ASICSynInterface

function dirInitial(){
  if(flow.isRebuild){
    if(fs.existsSync(flow.synLogDir)) {
      del.sync(flow.synLogDir)
      console.log('remove ', flow.synLogDir)
    }
    if(fs.existsSync(flow.synRunDir)) {
      del.sync(flow.synRunDir)
      console.log('remove ', flow.synRunDir)
    }
    if(fs.existsSync(flow.synOutputDir)) {
      del.sync(flow.synOutputDir)
      console.log('remove ', flow.synOutputDir)
    }
    if(fs.existsSync(flow.synRptputDir)) {
      del.sync(flow.synRptputDir)
      console.log('remove ', flow.synRptputDir)
    }
  }

  if (!fs.existsSync(flow.synLogDir)) {
    mkdirp.sync(flow.synLogDir)
  }
  if (!fs.existsSync(flow.synRunDir)) {
    mkdirp.sync(flow.synRunDir)
  }
  if (!fs.existsSync(flow.synOutputDir)) {
    mkdirp.sync(flow.synOutputDir)
  }
  if (!fs.existsSync(flow.synRptputDir)) {
    mkdirp.sync(flow.synRptputDir)
  }
}

gulp.task('gen:asicSynSH',()=>{
  dirInitial()

  const synScriptFile = toPath(flow.synRunDir, 'asic_syn_run.sh')

  const synScriptText = []

  synScriptText.push('#!/bin/sh')
  synScriptText.push('')
  synScriptText.push('dc_shell \\')
  synScriptText.push('     -64bit \\')
  synScriptText.push('     -f ../scripts/dc_syn.tcl')
  fs.writeFileSync(synScriptFile, synScriptText.join("\n"), 'utf8')

  const args = []
  args.push('+x')
  args.push(synScriptFile)
  runCmd('chmod', args)

  return new Promise((resolve)=>{
    console.log("-------------------------")
    console.log("write syn script: ")
    console.log(synScriptFile)
    console.log("-------------------------")
    console.log("Please check syn script.")
    resolve()
  })
})


gulp.task('setup:asicSyn', gulp.series('merge:asicFl', 'gen:asicSDC', 'gen:libTcl', 'gen:synTcl', 'gen:asicSynSH', ()=>{
  if(flow.runASICSyn){
    const synScriptFile = toPath(flow.synRunDir, 'asic_syn_run.sh')

    console.log("start run syn script => ", synScriptFile)

    const runSynScriptArgs= []
    runSynScriptArgs.push(synScriptFile)

    const cwd = flow.synRunDir
    process.chdir(cwd)
    return runCmd('sh', runSynScriptArgs, cwd).then(function() {
      console.log("============================")
      console.log("syn finished")
      console.log("============================")
    }).catch(function(){
      console.log("")
      console.log("ERROR! Please check code")
      console.log("")
      throw new Error(`syn failed`)
    })
  }

  return new Promise((resolve)=>{
    resolve()
  })
}))

module.exports.init = function(program) {
  program.allowUnknownOption()
    .option('-R', 'genarate syn script, and run')
    .option('--force', 'rebuild asic syn flow')
}

module.exports.flowName='asicSyn'

module.exports.setEnv = function(e) {
  let env = e

  flow = <ASICSynInterface>env.getFlow('asicSyn')
  flow.workDir  = env.flow.global.workDir

  flow.synDir = env.getOpt('asicFile.synDir', null)
  flow.synLogDir     = toPath(flow.synDir, 'log')
  flow.synRunDir     = toPath(flow.synDir, 'run')
  flow.synOutputDir  = toPath(flow.synDir, 'output')
  flow.synRptputDir  = toPath(flow.synDir, 'rpt')

  flow.runASICSyn = env.getOpt('asicSyn.R', false)
  flow.isRebuild = env.getOpt('asicSyn.force', env.getOpt('asicFile.isRebuild', false))
}
