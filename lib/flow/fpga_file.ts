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

import {FPGAFileInterface} from "../protocol/fpgaFileInterface"

let flow:FPGAFileInterface


function mergeFlistFileForSyn(chipTargetRTLFlistFile:string, flistFiles:any[], fpgaWorkDir:string, rtlRootDir:string){
  console.log("merge flistFiles =>", flistFiles)

  const templateVars = {
    define: '+define+',
    incdir: '+incdir+',
    fpgaWorkDir: fpgaWorkDir,
  }

  let targetFlist = ''
  for(let i of flistFiles){
    let tmpFlist = fs.readFileSync(i, 'utf8')
    targetFlist  += Mustache.render(tmpFlist, templateVars)
    // console.log("targetFlist =>", targetFlist)
  }
  
  let FlistTargetDir = Path.dirname(chipTargetRTLFlistFile)

  if(!fs.existsSync(FlistTargetDir)){
    mkdirp.sync(FlistTargetDir)
  }

  fs.writeFileSync(chipTargetRTLFlistFile, targetFlist, 'utf8')

  return new Promise((resolve)=>{
    console.log("")
    console.log("NOTE: gen chip verif flist file!")
    console.log(chipTargetRTLFlistFile)
    console.log("")
    resolve()
  })
}

gulp.task('merge:fpgaFl', gulp.series('gen:fpgaSyndutFl', () =>{
  const fpgaSynDutFile = toPath(flow.rtlRootDir, 'export', 'fpga_syn_dut.f')
  const targetFlistFile = flow.chipTargetRTLFlistFile
  const flistFiles = []

  let genFPGAFlistSrc = []
  if(flow.flist){
    flistFiles.push(flow.flist)
    genFPGAFlistSrc.push(flow.flist)
  } else {
    flistFiles.push(...flow.fpgaChipFlList)
    const modelDir = toPath(flow.fpgaWorkDir, 'model')
    const modelFlist = glob.sync(`{${toPath(modelDir, "**/*.sv")}, ${toPath(modelDir, "**/*.v")}, ${toPath(modelDir, "**/*.f")}}`)

    flistFiles.push(fpgaSynDutFile)
    genFPGAFlistSrc.push(...flistFiles)
  }

  if (flow.isRebuild && fs.existsSync(flow.chipTargetRTLFlistFile)){
    del.sync(flow.chipTargetRTLFlistFile)
  }

  let busy = false
  return gulp.src(genFPGAFlistSrc)
    .pipe(newer({
      map: (path) => {
        return targetFlistFile
      }
    }))
    .pipe(through.obj((chunk, enc, cb) => {
      // if find a new file, set busy
      if(busy){
        cb(null)
        return
      }
      busy = true
      console.log("gen asic sim file -> updated file :", chunk.path)
      console.log("")

      mergeFlistFileForSyn(targetFlistFile, flistFiles, flow.fpgaWorkDir, flow.rtlRootDir)
      cb()
    }))
    .pipe(gulp.dest(Path.dirname(flow.chipTargetRTLFlistFile)))
}))


function formatFlist(chipTargetRTLFlistFile:string, synTargetFl:string, synTool:string){
  const lines = fs.readFileSync(chipTargetRTLFlistFile, 'utf8').split(/\n/)

  let targetFlText = ''
  for(let line of lines){
    if(synTool == 'synplify'){
      if(line.match(/^\s*\/\//)) {
        // console.log("ingnore: ", line)
      }else if(line.match(/\+incdir\+/)) {
        // console.log(line)
      } else if(line.match(/\+define\+/)) {
        // console.log(line)
      } else if (line.match(/^\//)) {
        line = "read_verilog "+ line + "\n"
        targetFlText += line
      }
    } else {
      for(let line of lines){
        if(line.match(/^\s*\/\//)) {
          // console.log("ingnore: ", line)
        }else if(line.match(/\+incdir\+/)) {
          // console.log(line)
        } else if(line.match(/\+define\+/)) {
          // console.log(line)
        } else if (line.match(/^\//)) {
          line = "add_file -verilog \""+line+"\"\n"
          targetFlText += line
        }
      }
    }
  }

  fs.writeFileSync(synTargetFl, targetFlText, 'utf8')
}

gulp.task('gen:vivadoFl',()=>{

  let chipTargetRTLFlistFile = ''
  if(fs.existsSync(flow.chipTargetRTLFlistFile)){
    chipTargetRTLFlistFile = flow.chipTargetRTLFlistFile
  } else {
    console.log("Error: chipTargetRTLFlistFile-> "+flow.chipTargetRTLFlistFile+" don't have exist")
    process.exit()
  }

  let FlistTargetDir = Path.dirname(flow.vivadoSynFl)
  if(!fs.existsSync(FlistTargetDir)){
    mkdirp.sync(FlistTargetDir)
  }

  formatFlist(chipTargetRTLFlistFile, flow.vivadoSynFl, 'vivado')
  return new Promise((resolve)=>{
    resolve()
  })
})

gulp.task('gen:synplifyFl',()=>{

  let chipTargetRTLFlistFile = ''
  if(fs.existsSync(flow.chipTargetRTLFlistFile)){
    chipTargetRTLFlistFile = flow.chipTargetRTLFlistFile
  } else {
    console.log("Error: chipTargetRTLFlistFile-> "+flow.chipTargetRTLFlistFile+" don't have exist")
    process.exit()
  }

  let FlistTargetDir = Path.dirname(flow.synplifySynFl)
  if(!fs.existsSync(FlistTargetDir)){
    mkdirp.sync(FlistTargetDir)
  }

  formatFlist(chipTargetRTLFlistFile, flow.synplifySynFl, 'synplify')
  return new Promise((resolve)=>{
    resolve()
  })
})

gulp.task('gen:fpgaSynSDC', ()=>{
  return new Promise((resolve)=>{
    resolve()
  })
})

gulp.task('gen:fpgaImpSDC', ()=>{
  return new Promise((resolve)=>{
    resolve()
  })
})

gulp.task('_Test',()=>{
  console.log(" flow.fpgaWorkDir = ", flow.fpgaWorkDir)
  console.log(" flow.rtlRootDir = ", flow.rtlRootDir)
  console.log(" flow.flist = ", flow.flist)
  console.log(" flow.fpgaChipFlList = ", flow.fpgaChipFlList)
  console.log(" flow.chipTargetRTLFlistFile = ", flow.chipTargetRTLFlistFile)
  console.log(" flow.synplifySynFl = ", flow.synplifySynFl)
  console.log(" flow.buildDir = ", flow.buildDir)
  console.log(" flow.workDir = ", flow.workDir)

  return new Promise((resolve)=>{
    resolve()
  })
})

module.exports.init = function(program) {
  program.allowUnknownOption()
    .option('--force', 'force rebuild')
    .option('--flist <args>', 'specify your flist')
}

module.exports.flowName='fpgaFile'

module.exports.setEnv = function(e) {
  let env = e

  flow = <FPGAFileInterface>env.getFlow('fpgaFile')

  flow.workDir        = env.flow.global.workDir 

  flow.fpgaWorkDir = env.getOpt('fpgaFile.fpgaWorkDir', null)
  flow.rtlRootDir     = env.getOpt('file.rtlRootDir', null)

  let buildDir  = toPath(flow.fpgaWorkDir, 'build/fpga')
  flow.buildDir = env.getOpt('fpgaSyn.buildDir', buildDir)

  let customFlist = env.getOpt('fpgaFile.flist', null)
  if(customFlist != null){
    let customFlistPath = getFullPath(flow.workDir, customFlist)
    if(fs.existsSync(customFlistPath)){
      flow.flist  = customFlistPath
    }
  } else {
    flow.flist  = null
  }
  flow.fpgaChipFlList  = env.getOpt('fpgaFile.fpgaChipFlList', [])

  let chipTargetRTLFlistFile = toPath(flow.buildDir, 'fpga_chip_syn.f')
  flow.chipTargetRTLFlistFile = env.getOpt('fpgaFile.chipTargetRTLFlistFile', chipTargetRTLFlistFile)

  const synSynplifyBuildDir = toPath(flow.buildDir, 'syn_synplify')
  const synVivadoBuildDir   = toPath(flow.buildDir, 'syn_vivado')
  flow.synSynplifyBuildDir  = env.getOpt('fpgaSyn.synSynplifyBuildDir', synSynplifyBuildDir)
  flow.synVivadoBuildDir   = env.getOpt('fpgaSyn.synVivadoBuildDir', synVivadoBuildDir)

  let synplifySynFl  = toPath(flow.synSynplifyBuildDir, 'fpga_chip_syn.tcl')
  flow.synplifySynFl = env.getOpt('fpgaFile.synplifySynFl', synplifySynFl)
  let vivadoSynFl = toPath(flow.synVivadoBuildDir, 'fpga_chip_syn.tcl')
  flow.vivadoSynFl = env.getOpt('fpgaFile.vivadoSynFl', vivadoSynFl)

  flow.isRebuild = env.getOpt('fpgaFile.force', false)
}
