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

import {FPGAImpInterface} from "../protocol/fpgaImpInterface"

let flow:FPGAImpInterface


gulp.task('gen:vivadoImpTcl', ()=>{
  const templateScriptFile = 'template/fpga/vivado_imp_non_prj.tcl_template'
  const impTclScriptFile = toPath(flow.impBuildDir, 'vivado_imp_non_prj.tcl')

  if(!fs.existsSync(flow.impBuildDir)){
    mkdirp.sync(flow.impBuildDir)
  }

  const templateVars = {
    physicalConstrainFile: flow.vivadoImpConstrain,
    fpgaWorkDir : flow.fpgaWorkDir,
    technology  : flow.fpgaTechnology,
    part        : flow.fpgaPart,
    package     : flow.fpgaPackage,
    speedGrade  : flow.fpgaSpeedGrade,
    topModule   : flow.topModule,
    FPGAPart    : flow.FPGAPart
  }

  let templateScriptText = fs.readFileSync(templateScriptFile, 'utf8')
  let impScriptText = Mustache.render(templateScriptText, templateVars)

  fs.writeFileSync(impTclScriptFile, impScriptText, 'utf8')

  return new Promise((resolve)=>{
    resolve()
  })
})

gulp.task('gen:vivadoImpSH',()=>{
  const impSHScriptFile = toPath(flow.impBuildDir, 'fpga_imp_run.sh')
  const impTclScriptFile = toPath(flow.impBuildDir, 'vivado_imp_non_prj.tcl')

  const impScriptText = []

  impScriptText.push('#!/bin/tcsh')
  impScriptText.push('')
  impScriptText.push('nohup vivado \\')
  impScriptText.push('         -nojournal \\')
  impScriptText.push('         -m64 \\')
  impScriptText.push('         -mode batch \\')
  impScriptText.push('         -source '+ impTclScriptFile + ' \\')

  fs.writeFileSync(impSHScriptFile, impScriptText.join("\n"), 'utf8')

  const args = []
  args.push('+x')
  args.push(impSHScriptFile)
  runCmd('chmod', args)

  return new Promise((resolve)=>{
    console.log("-------------------------")
    console.log("write imp script: ")
    console.log(impSHScriptFile)
    console.log("-------------------------")
    console.log("Please check syn script.")
    resolve()
  })
})

gulp.task('setup:vivadoImp', gulp.series('gen:vivadoImpTcl', 'gen:vivadoImpSH', ()=>{
  if(flow.runFPGAImp){
    const impSHScriptFile = toPath(flow.impBuildDir, 'asic_syn_run.sh')

    console.log("start run imp script => ", impSHScriptFile)

    const runImpScriptArgs= []
    runImpScriptArgs.push(impSHScriptFile)

    const cwd = flow.impBuildDir
    process.chdir(cwd)
    return runCmd('tcsh', runImpScriptArgs, cwd).then(function() {
      console.log("============================")
      console.log("imp finished")
      console.log("============================")
    }).catch(function(){
      console.log("")
      console.log("ERROR! Please check code")
      console.log("")
      throw new Error(`imp failed`)
    })
  }

  return new Promise((resolve)=>{
    resolve()
  })
}))

module.exports.init = function(program) {
  program.allowUnknownOption()
    .option('-R', 'genarate imp script, and run')
    .option('--impBuildDir <args>', 'specify imp build Dir')
    .option('--force', ' force rebuild')
}

module.exports.flowName='fpgaImp'

module.exports.setEnv = function(e) {
  let env = e

  flow = <FPGAImpInterface>env.getFlow('fpgaImp')
  flow.workDir        = env.flow.global.workDir 
  flow.fpgaWorkDir = env.getOpt('fpgaFile.fpgaWorkDir', null)
  flow.buildDir = env.getOpt('fpgaFile.buildDir', null)

  let impBuildDir  = toPath(flow.buildDir, 'imp_vivado')
  flow.impBuildDir = env.getOpt('fpgaImp.impBuildDir', impBuildDir)

  flow.topModule           = env.getOpt('fpgaSyn.topModule', null)
  flow.board               = env.getOpt('fpgaSyn.board', null)
  flow.edfNetlist          = env.getOpt('fpgaSyn.edfNetlist', null)
  flow.vivadoImpConstrain  = env.getOpt('fpgaImp.vivadoImpConstrain', null)

  flow.fpgaTechnology   = env.getOpt('fpgaSyn.fpgaTechnology', null)
  flow.fpgaPart         = env.getOpt('fpgaSyn.fpgaPart', null)
  flow.fpgaPackage      = env.getOpt('fpgaSyn.fpgaPackage', null)
  flow.fpgaSpeedGrade   = env.getOpt('fpgaSyn.fpgaSpeedGrade', null)
  flow.FPGAPart         = env.getOpt('fpgaSyn.FPGAPart', null)

  flow.runFPGAImp = env.getOpt('fpgaImp.R', false)
  flow.isRebuild = env.getOpt('fpgaImp.force', false)
}
