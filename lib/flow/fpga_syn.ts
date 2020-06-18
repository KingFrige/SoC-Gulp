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

import {FPGASynInterface} from "../protocol/fpgaSynInterface"

let flow:FPGASynInterface

gulp.task('gen:synplifySynTcl', ()=>{
  const templateScriptFile = 'template/fpga/synplify_syn_prj.tcl_template'
  const synTclScriptFile = toPath(flow.synSynplifyBuildDir, 'synplify_syn.prj')

  if(!fs.existsSync(flow.synSynplifyBuildDir)){
    mkdirp.sync(flow.synSynplifyBuildDir)
  }

  const templateVars = {
    chipFlist     : flow.synplifySynFl,
    synplifyConstrainFile: flow.syplifySynConstrain,
    fpgaWorkDir   : flow.fpgaWorkDir,
    technology    : flow.fpgaTechnology,
    part          : flow.fpgaPart,
    package       : flow.fpgaPackage,
    speedGrade    : flow.fpgaSpeedGrade,
    topModule     : flow.topModule,
  }

  let templateScriptText = fs.readFileSync(templateScriptFile, 'utf8')
  let synScriptText = Mustache.render(templateScriptText, templateVars)

  fs.writeFileSync(synTclScriptFile, synScriptText, 'utf8')
  return new Promise((resolve)=>{
    resolve()
  })
})

gulp.task('gen:synplifySynSH',()=>{
  const synSHScriptFile = toPath(flow.synSynplifyBuildDir, 'fpga_syn_run.sh')
  const synTclScriptFile = toPath(flow.synSynplifyBuildDir, 'synplify_syn.prj')

  const synScriptText = []

  synScriptText.push('#!/bin/tcsh')
  synScriptText.push('')
  synScriptText.push('nohup synplify_premier \\')
  synScriptText.push('     -shell '+synTclScriptFile+' \\')
  synScriptText.push('     -runall')

  fs.writeFileSync(synSHScriptFile, synScriptText.join("\n"), 'utf8')

  const args = []
  args.push('+x')
  args.push(synSHScriptFile)
  runCmd('chmod', args)

  return new Promise((resolve)=>{
    console.log("-------------------------")
    console.log("write syn script: ")
    console.log(synSHScriptFile)
    console.log("-------------------------")
    console.log("Please check syn script.")
    resolve()
  })
})


gulp.task('setup:synplifySyn', gulp.series('merge:fpgaFl', 'gen:synplifyFl', 'gen:fpgaSynSDC', 'gen:synplifySynTcl', 'gen:synplifySynSH', ()=>{
  if(flow.runFPGASyn){
    const synSHScriptFile = toPath(flow.synSynplifyBuildDir, 'asic_syn_run.sh')

    console.log("start run syn script => ", synSHScriptFile)

    const runSynScriptArgs= []
    runSynScriptArgs.push(synSHScriptFile)

    const cwd = flow.synSynplifyBuildDir
    process.chdir(cwd)
    return runCmd('tcsh', runSynScriptArgs, cwd).then(function() {
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

gulp.task('gen:vivadoSynTcl', ()=>{
  const templateScriptFile = 'template/fpga/vivado_syn_non_prj.tcl_template'
  const synTclScriptFile = toPath(flow.synVivadoBuildDir, 'vivado_syn_non_prj.tcl')

  if(!fs.existsSync(flow.synVivadoBuildDir)){
    mkdirp.sync(flow.synVivadoBuildDir)
  }

  const templateVars = {
    chipSynFlistFile   : flow.vivadoSynFl,
    vivadoSynConstrain : flow.vivadoSynConstrain,
    outputDir   : flow.synVivadoBuildDir,
    FPGAPart    : flow.FPGAPart,
    topModule   : flow.topModule,
  }

  let templateScriptText = fs.readFileSync(templateScriptFile, 'utf8')
  let synScriptText = Mustache.render(templateScriptText, templateVars)

  fs.writeFileSync(synTclScriptFile, synScriptText, 'utf8')
  return new Promise((resolve)=>{
    resolve()
  })
})


gulp.task('gen:vivadoSynSH',()=>{
  const synSHScriptFile = toPath(flow.synVivadoBuildDir, 'fpga_syn_run.sh')
  const synTclScriptFile = toPath(flow.synVivadoBuildDir, 'vivado_syn_non_prj.tcl')

  const synScriptText = []

  synScriptText.push('#!/bin/tcsh')
  synScriptText.push('')
  synScriptText.push('nohup vivado \\')
  synScriptText.push('     -nojournal  \\')
  synScriptText.push('     -mode tcl \\')
  synScriptText.push('     -source '+ synTclScriptFile)

  fs.writeFileSync(synSHScriptFile, synScriptText.join("\n"), 'utf8')

  const args = []
  args.push('+x')
  args.push(synSHScriptFile)
  runCmd('chmod', args)

  return new Promise((resolve)=>{
    console.log("-------------------------")
    console.log("write syn script: ")
    console.log(synSHScriptFile)
    console.log("-------------------------")
    console.log("Please check syn script.")
    resolve()
  })
})

gulp.task('setup:vivadoSyn', gulp.series('merge:fpgaFl', 'gen:vivadoFl', 'gen:fpgaSynSDC', 'gen:vivadoSynTcl', 'gen:vivadoSynSH', ()=>{
  if(flow.runFPGASyn){
    const synSHScriptFile = toPath(flow.synVivadoBuildDir, 'asic_syn_run.sh')

    console.log("start run syn script => ", synSHScriptFile)

    const runSynScriptArgs= []
    runSynScriptArgs.push(synSHScriptFile)

    const cwd = flow.synVivadoBuildDir
    process.chdir(cwd)
    return runCmd('tcsh', runSynScriptArgs, cwd).then(function() {
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
    .option('--synSynplifyBuildDir <args>', 'specify build Dir')
    .option('--synVivadoBuildDir <args>', 'specify build Dir')
    .option('--force', ' force rebuild')
}

module.exports.flowName='fpgaSyn'

module.exports.setEnv = function(e) {
  let env = e

  flow = <FPGASynInterface>env.getFlow('fpgaSyn')

  flow.workDir     = env.flow.global.workDir 
  flow.fpgaWorkDir = env.getOpt('fpgaFile.fpgaWorkDir', null)
  flow.buildDir    = env.getOpt('fpgaFile.buildDir', null)

  flow.synSynplifyBuildDir = env.getOpt('fpgaFile.synSynplifyBuildDir', null)
  flow.synVivadoBuildDir  = env.getOpt('fpgaFile.synVivadoBuildDir', null)

  flow.synplifySynFl = env.getOpt('fpgaFile.syplifySynFl',null)
  flow.vivadoSynFl = env.getOpt('fpgaFile.vivadoSynFl',null)

  flow.topModule        = env.getOpt('fpgaSyn.topModule', null)
  flow.board            = env.getOpt('fpgaSyn.board', null)
  flow.syplifySynConstrain = env.getOpt('fpgaSyn.syplifySynConstrain', null)
  flow.vivadoSynConstrain  = env.getOpt('fpgaSyn.vivadoSynConstrain', null)
  flow.ipVivadoTcls     = env.getOpt('fpgaSyn.ipVivadoTcls', null)
  flow.edfNetlist       = env.getOpt('fpgaSyn.edfNetlist', null)

  flow.fpgaTechnology   = env.getOpt('fpgaSyn.fpgaTechnology', null)
  flow.fpgaPart         = env.getOpt('fpgaSyn.fpgaPart', null)
  flow.fpgaPackage      = env.getOpt('fpgaSyn.fpgaPackage', null)
  flow.fpgaSpeedGrade   = env.getOpt('fpgaSyn.fpgaSpeedGrade', null)
  flow.FPGAPart         = env.getOpt('fpgaSyn.FPGAPart', null)

  flow.runFPGASyn = env.getOpt('fpgaSyn.R', false)
  flow.isRebuild  = env.getOpt('fpgaSyn.force', false)
}
