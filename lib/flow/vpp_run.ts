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

const {toPath,getFullPath, runCmdDetached, runCmd, delBuildDirAndFile} = require('sulp_utils')
const {getVppOutFileBaseName, getVppreprocCmdLine, getVppCmdListFromTag} = require('flow/vpp_module.ts')

import {VppRunInterface} from "../protocol/vppRunInterface"

let flow:VppRunInterface

function getSrcFlist(rtlDir:string, rtlConfigFile:string){
  const verilogFlist = glob.sync(`${toPath(rtlDir, "**/*.v")}`, { nodir: true })
  const svFlist = glob.sync(`${toPath(rtlDir, "**/*.sv")}`, { nodir: true })
  const flFlist = glob.sync(`${toPath(rtlDir, "**/*.f")}`, { nodir: true })
  const FlFlist = glob.sync(`${toPath(rtlDir, "**/*.F")}`, { nodir: true })
  const vhFlist = glob.sync(`${toPath(rtlDir, "**/*.vh")}`, { nodir: true })
  const incFlist = glob.sync(`${toPath(rtlDir, "**/*.inc")}`, { nodir: true })
  const hFlist = glob.sync(`${toPath(rtlDir, "**/*.h")}`, { nodir: true })
  const cvsFlist = glob.sync(`${toPath(rtlDir, "**/*.cvs")}`, { nodir: true })

  const allFileList = verilogFlist.concat(svFlist, flFlist, FlFlist, vhFlist, hFlist, cvsFlist)
  if(fs.existsSync(rtlConfigFile)){
    allFileList.push(rtlConfigFile)
  }

  const srcFlist = _.filter(allFileList, function(fileName){
    if (fileName.match(/\/rtl\/export\//) || fileName.match(/\/rtl\/rtl_export\//)){
    } else {
      return fileName
    }
  })
  return srcFlist
}

function printFinishedInfo(message:string){
  console.log("=============================")
  console.log(message)
  console.log("=============================")
}

gulp.task('vpp:asicsim',(cb)=>{
  getVppFl('asic_sim', flow.rtlRootDir, flow.rtlConfigFile)
    .then(()=> {
      printFinishedInfo('vpp gen asic_sim finished')
      cb()
    })
})


gulp.task('vpp:asicsyn',(cb)=>{
  getVppFl('asic_syn', flow.rtlRootDir, flow.rtlConfigFile)
    .then(()=> {
      printFinishedInfo('vpp gen asic_syn finished')
      cb()
    })
})

gulp.task('vpp:fpgasim',(cb)=>{
  getVppFl('fpga_sim', flow.rtlRootDir, flow.rtlConfigFile)
    .then(()=> {
      printFinishedInfo('vpp gen fpga_sim finished')
      cb()
    })
})

gulp.task('vpp:fpgasyn',(cb)=>{
  getVppFl('fpga_syn', flow.rtlRootDir, flow.rtlConfigFile)
    .then(()=> {
      printFinishedInfo('vpp gen fpga_syn finished')
      cb()
    })
})

gulp.task('vpp:dummy',(cb)=>{
  getVppFl('dummy', flow.rtlRootDir, flow.rtlConfigFile)
    .then(()=> {
      printFinishedInfo('vpp gen dummy finished')
      cb()
    })
})

function getVppFl(flistTag:string, rtlRootDir:string, rtlConfigFile:string){
  return new Promise((resolve, reject) => {
    const vppExportDir     = toPath(flow.vppRTLExportDir, 'vpp')
    const targetVppExportDir = toPath(vppExportDir, flistTag + '_vpp')
    const vppreprocLogFile = toPath(vppExportDir, flistTag + '_vppreprocRunInfo.log')

    if (flow.isRebuild ){
      if (fs.existsSync(vppreprocLogFile)) { del.sync(vppreprocLogFile) }
      if (fs.existsSync(targetVppExportDir)) { del.sync(targetVppExportDir)}
    }

    const srcFlist = getSrcFlist(rtlRootDir, rtlConfigFile)
    let busy = false
    return gulp.src(srcFlist)
      .pipe(newer(vppreprocLogFile))
      .pipe(through.obj((chunk, enc, cb) => {
        if(busy){
          cb(null)
          return
        }
        busy = true

        if (fs.existsSync(targetVppExportDir)) { del.sync(targetVppExportDir)}
        mkdirp.sync(targetVppExportDir)

        const moduleFlistConfigList = require(rtlConfigFile)
        const cmdList = getVppCmdListFromTag(flistTag, moduleFlistConfigList, rtlRootDir, targetVppExportDir)
        let exeCmd = new Promise(function(resolve, reject) {resolve(1)})
        const total = cmdList.length

        let runCnt = 0
        for(let cmdLine of cmdList){
          exeCmd = exeCmd.then(function() {
            const myCmdLine = cmdLine.cmd + cmdLine.args.join(" ") + "\n"
            return runCmd(cmdLine.cmd, cmdLine.args, cmdLine.cwd)
              .then(function(){
                fs.appendFileSync(vppreprocLogFile, myCmdLine, 'utf8')
                console.log("export ",cmdLine.outFile)
                runCnt += 1
                if(runCnt == total){
                  recordVppLog(vppreprocLogFile)
                  cb()
                }
              })
              .catch(() => {
                console.log("ERROR, ", myCmdLine)
              })
          })
        }
      }))
      .pipe(gulp.dest(vppExportDir))
      .on('end', () => {
        resolve(1)
      })
  })
}

function recordVppLog(vppreprocLogFile:string){
  let timestamp = new Date()
  fs.appendFileSync(vppreprocLogFile, "\n=======================\n", 'utf8')
  fs.appendFileSync(vppreprocLogFile, timestamp, 'utf8')
  fs.appendFileSync(vppreprocLogFile, "\n=======================\n", 'utf8')
  fs.appendFileSync(vppreprocLogFile, "\n\n\n", 'utf8')
}

gulp.task('vpp:component', gulp.series('vpp:asicsim', 'vpp:asicsyn', 'vpp:fpgasim', 'vpp:fpgasyn', 'vpp:dummy'))

function getFlist(mypathList: string[], projectPathStr){
  let linesText = ''
  for (let pathLine of mypathList) {
    let dirname = Path.dirname(Path.resolve(pathLine))
    if(projectPathStr != null){
       dirname = dirname.replace(flow.projectDir, projectPathStr)
    }
    let lines = fs.readFileSync(pathLine, 'utf8').split(/\n/)
    for (let line of lines) {
      if (line.trim() !== '') {
        if (line.match(/^[a-zA-Z_]/) || line.match(/^\./)) {
          let tmpLine = line.replace(/^/, dirname + '/')
          linesText += tmpLine.replace( /\/\.\//,  '/') + '\n'
        } else if(line.match(/^-v\s+[a-zA-Z]/) || line.match(/^-v\s+\./)) {
          let tmpLine = line.replace(/^-v\s+/, '-v ' + dirname + '/')
          linesText += tmpLine.replace( /\/\.\//,  '/') + '\n'
        } else if(line.match(/^\+incdir\+\./)) {
          let tmpLine = line.replace(/^\+incdir\+/, '+incdir+' + dirname + '/')
          linesText += tmpLine.replace(/\/\.\//,  '/') + '\n'
        } else {
          linesText += line.replace(/\/\.\//, '/') + '\n'; // remove (./)
        }
      }
    }
  }
  return linesText
}

function getNovppFlistFromTag(flistTag:string, rtlConfigFile:string, rtlRootDir:string){
  const rtlConfigList = require(rtlConfigFile)
  let RTLFlist = []

  for(let item of rtlConfigList){
    if(!item.isVppreproc){
      for(let flistLine of item.flist){
        if(flistLine.path != ''){
          if(flistLine.tags.includes(flistTag)){
            RTLFlist.push(getFullPath(Path.resolve(rtlRootDir), flistLine.path))
          }
        }
      }
    }
  }
  return RTLFlist
}

function getNovppFl(flistTag:string, rtlRootDir:string, rtlConfigFile:string, projectPathStr){
  return new Promise((resolve, reject) => {
    const novppExportDir = toPath(flow.vppRTLExportDir, 'novpp')
    const targetRTLFlistFile = toPath(novppExportDir, flistTag + '_novpp_rtl.f')

    if (flow.isRebuild ){
      if (fs.existsSync(targetRTLFlistFile))    { del.sync(targetRTLFlistFile) }
    }

    const srcFlist = getSrcFlist(rtlRootDir, rtlConfigFile)
    let busy = false
    return gulp.src(srcFlist)
      .pipe(newer(targetRTLFlistFile))
      .pipe(through.obj((chunk, enc, cb) => {
        if(busy){
          cb(null)
          return
        }
        busy = true

        if (fs.existsSync(targetRTLFlistFile))  { 
          del.sync(targetRTLFlistFile)
        }
        if (!fs.existsSync(novppExportDir))  { 
          mkdirp.sync(novppExportDir)
        }

        const targetRTLFlist = getNovppFlistFromTag(flistTag, rtlConfigFile, rtlRootDir)
        if(targetRTLFlist.length != 0){
          let targetRTLFlistLines   = getFlist(targetRTLFlist, projectPathStr)
          fs.writeFileSync(targetRTLFlistFile, targetRTLFlistLines, 'utf8')
        }

        console.log("============================")
        console.log("write novpp file ", targetRTLFlistFile)
        console.log("============================")
        cb()
      }))
      .pipe(gulp.dest(novppExportDir))
      .on('end', () => {
        resolve(1)
      })
  })
}

gulp.task('gen:asicSynNovppFl', (cb) => {
  getNovppFl('asic_syn', flow.rtlRootDir, flow.rtlConfigFile, flow.projectPathStr)
    .then(()=> {
      printFinishedInfo('novpp gen asic_syn finished')
      cb()
    })
})

gulp.task('gen:asicSimNovppFl', (cb) => {
  getNovppFl('asic_sim', flow.rtlRootDir, flow.rtlConfigFile, flow.projectPathStr)
    .then(()=> {
      printFinishedInfo('novpp gen asic_sim finished')
      cb()
    })
})

gulp.task('gen:fpgaSynNovppFl', (cb) => {
  getNovppFl('fpga_syn', flow.rtlRootDir, flow.rtlConfigFile, flow.projectPathStr)
    .then(()=> {
      printFinishedInfo('novpp gen fpga_syn finished')
      cb()
    })
})

gulp.task('gen:fpgaSimNovppFl', (cb) => {
  getNovppFl('fpga_sim', flow.rtlRootDir, flow.rtlConfigFile, flow.projectPathStr)
    .then(()=> {
      printFinishedInfo('novpp gen fpga_sim finished')
      cb()
    })
})

gulp.task('gen:dummyNovppFl', (cb) => {
  getNovppFl('dummy', flow.rtlRootDir, flow.rtlConfigFile, flow.projectPathStr)
    .then(()=> {
      printFinishedInfo('novpp gen dummy finished')
      cb()
    })
})

gulp.task('gen:novppFl', gulp.series('gen:asicSynNovppFl', 'gen:asicSimNovppFl', 'gen:fpgaSynNovppFl', 'gen:fpgaSimNovppFl', 'gen:dummyNovppFl'))

function genDutFl(flistTag:string, rtlExportDir:string, projectPathStr:string){
  return new Promise((resolve, reject) => {
    const vppExportDir   = toPath(rtlExportDir, 'vpp')
    const targeVppExportDir = toPath(vppExportDir, flistTag + '_vpp')
    const novppExportDir = toPath(rtlExportDir, 'novpp')

    const targetDutFile = toPath(flow.vppRTLExportDir, flistTag + '_dut.f')
    const targetRTLFlistFile = toPath(novppExportDir, flistTag + '_novpp_rtl.f')

    if (flow.isRebuild ){
      if (fs.existsSync(targetDutFile))  { del.sync(targetDutFile)}
    }

    const targetVppExportFiles = glob.sync(`${toPath(targeVppExportDir, "*")}`, { nodir: true })
    let srcFlist = targetVppExportFiles.slice()
    if(fs.existsSync(targetRTLFlistFile)){
      srcFlist.push(targetRTLFlistFile)
    }

    let busy = false
    return gulp.src(srcFlist)
      .pipe(newer(targetDutFile))
      .pipe(through.obj((chunk, enc, cb) => {
        if(busy){
          cb(null)
          return
        }
        busy = true

        let targetDutOutputFlist = targetVppExportFiles.join("\n") + "\n"
        if(projectPathStr != null){
          targetDutOutputFlist = targetDutOutputFlist.replace(new RegExp(flow.projectDir, 'g'), projectPathStr)
        }

        if(fs.existsSync(targetRTLFlistFile)){
          let targetNoVppExportFlist = fs.readFileSync(targetRTLFlistFile, 'utf8')
          targetDutOutputFlist += targetNoVppExportFlist + '\n'
        }
        fs.writeFileSync(targetDutFile, targetDutOutputFlist, 'utf8')

        console.log("============================")
        console.log("write dut file ", targetDutFile)
        console.log("============================")
        cb()
      }))
      .pipe(gulp.dest(rtlExportDir))
      .on('end', () => {
        resolve(1)
      })
  })
}

gulp.task('_genAsicSyndutFl', gulp.series('vpp:asicsyn', 'gen:asicSynNovppFl', (cb)=>{
  genDutFl('asic_syn', flow.vppRTLExportDir, flow.projectPathStr)
    .then(()=> {
      printFinishedInfo('asic_syn dut gen finished')
      cb()
    })
}))
gulp.task('gen:asicSyndutFl', gulp.series('gen:chipFlConfig', '_genAsicSyndutFl'))

gulp.task('_genAsicSimdutFl', gulp.series('vpp:asicsim', 'gen:asicSimNovppFl', (cb)=>{
  genDutFl('asic_sim', flow.vppRTLExportDir, flow.projectPathStr)
    .then(()=> {
      printFinishedInfo('asic_sim dut gen finished')
      cb()
    })
}))
gulp.task('gen:asicSimdutFl', gulp.series('gen:chipFlConfig', '_genAsicSimdutFl'))

gulp.task('_genFpgaSyndutFl', gulp.series('vpp:fpgasyn', 'gen:fpgaSynNovppFl', (cb)=>{
  genDutFl('fpga_syn', flow.vppRTLExportDir, flow.projectPathStr)
    .then(()=> {
      printFinishedInfo('fpga_syn dut gen finished')
      cb()
    })
}))
gulp.task('gen:fpgaSyndutFl', gulp.series('gen:chipFlConfig', '_genFpgaSyndutFl'))

gulp.task('_genFpgaSimdutFl', gulp.series('vpp:fpgasim', 'gen:fpgaSimNovppFl', (cb)=>{
  genDutFl('fpga_sim', flow.vppRTLExportDir, flow.projectPathStr)
    .then(()=> {
      printFinishedInfo('fpga_sim dut gen finished')
      cb()
    })
}))
gulp.task('gen:fpgaSimdutFl', gulp.series('gen:chipFlConfig', '_genFpgaSimdutFl'))

gulp.task('_genDummydutFl', gulp.series('vpp:dummy', 'gen:dummyNovppFl', (cb)=>{
  genDutFl('dummy', flow.vppRTLExportDir, flow.projectPathStr)
    .then(()=> {
      printFinishedInfo('dummy dut gen finished')
      cb()
    })
}))
gulp.task('gen:dummydutFl', gulp.series('gen:chipFlConfig', '_genDummydutFl'))

gulp.task('gen:dutFl', gulp.series('gen:chipFlConfig', '_genAsicSyndutFl', '_genAsicSimdutFl', '_genFpgaSyndutFl', '_genFpgaSimdutFl', '_genDummydutFl'))

gulp.task('clean:vppRun', () => {
  const rtlExportDir   = flow.vppRTLExportDir

  const asicSimDutFile = toPath(rtlExportDir, 'asic_sim_dut.f')
  const asicSynDutFile = toPath(rtlExportDir, 'asic_syn_dut.f')
  const fpgaSynDutFile = toPath(rtlExportDir, 'fpga_syn_dut.f')
  const fpgaSimDutFile = toPath(rtlExportDir, 'fpga_sim_dut.f')
  const dummyDutFile   = toPath(rtlExportDir, 'dummy_dut.f')
  const vppExportDir   = toPath(rtlExportDir, 'vpp')
  const novppExportDir = toPath(rtlExportDir, 'novpp')

  return new Promise(function(resolve) {
    delBuildDirAndFile(asicSimDutFile)
    delBuildDirAndFile(asicSynDutFile)
    delBuildDirAndFile(fpgaSynDutFile) 
    delBuildDirAndFile(fpgaSimDutFile)
    delBuildDirAndFile(dummyDutFile)   

    delBuildDirAndFile(vppExportDir)
    delBuildDirAndFile(novppExportDir)
    return resolve(1) 
  })
})

module.exports.init = function(program) {
  program.allowUnknownOption()
    .option('-v, --version [soc|fpga]', 'select version') 
    .option('-p, --prpcess, [rtl|pre|post]', 'for sim, you need select sim step')
    .option('--force', 'delect old data, and rebuild')
}

module.exports.flowName='vppRun'

module.exports.setEnv = function(e) {
  let env = e

  flow = <VppRunInterface>env.getFlow('vppRun')
  flow.rtlRootDir  = env.getOpt('global.rtlRootDir', null)
  flow.projectDir  = env.getOpt('global.projectDir', null)
  flow.projectPathStr  = env.getOpt('global.projectPathStr', null)

  flow.rtlConfigFile = env.getOpt('vppFile.rtlConfigFile', null)

  flow.vppRTLExportDir = env.getOpt('vppRun.vppRTLExportDir', toPath(flow.rtlRootDir, 'export'))

  flow.isRebuild   = (env.getOpt('vppRun.force') != null) ? true : false
}
