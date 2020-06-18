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

const {toPath,getFullPath, runCmdDetached, runCmd} = require('sulp_utils')

import {VppModuleInterface} from "../protocol/vppModuleInterface"

let flow:VppModuleInterface

function getVppreprocCmdLine(flist:string[], suffix:string, exportDir:string){
  const ret = []
  const spliceNum = flist.length > 1 ? 3 : 2

  for(let flistPath of flist){
    let fileSize = 0
    const stat = fs.statSync(flistPath)
    if(stat) {
      fileSize = stat.size
    } else {
      console.log("ERROR!")
    }
    if(fileSize == 0){
      continue
    }

    const outFile = toPath(exportDir, getVppOutFileBaseName(flistPath, suffix, spliceNum))
    const args=['--simple', '-f', flistPath, '--o', outFile]
    let cmdLine = {
      cmd : 'vppreproc',
      args: args,
      cwd : Path.dirname(flistPath),
      outFile: outFile
    }
    ret.push(cmdLine)
  }
  return ret
}

function getVppOutFileBaseName(flistPath:string, suffix:string, spliceNum:number){
  const pathList = flistPath.split(/\//)
  const baseNameList = pathList.splice(pathList.length-spliceNum, spliceNum)
  const mySuffix = (( suffix != null) && (suffix != '')) ? suffix : '.sv'
  const outFileBaseName  = baseNameList.join('_') + '.all' + mySuffix

  return outFileBaseName
}

gulp.task('vpp:module',(cb)=>{
  const moduleDir = flow.moduleDir
  const moduleInfoFile = toPath(moduleDir, 'module_info.json5')

  const dstDir = flow.vppBuildDir
  if(fs.existsSync(dstDir)){
    if(dstDir.match(/build\//)){
      del.sync(dstDir)
      console.log("del =>", dstDir)
      console.log("")
    }
  }
  if (!fs.existsSync(dstDir)) {
    mkdirp.sync(dstDir)
  }

  if(fs.existsSync(moduleInfoFile)){
    const moduleInfoList = require(moduleInfoFile)
    const cmdList = getVppCmdListFromTag('asic_syn', moduleInfoList.flist, flow.moduleDir, dstDir)

    let exeCmd = new Promise(function(resolve, reject) {resolve(1)})
    const total = cmdList.length

    let runCnt = 0
    for(let cmdLine of cmdList){
      exeCmd = exeCmd.then(function() {
        const myCmdLine = cmdLine.cmd + cmdLine.args.join(" ") + "\n"
        return runCmd(cmdLine.cmd, cmdLine.args, cmdLine.cwd)
          .then(function(){
            console.log(myCmdLine)
            console.log("export ",cmdLine.outFile)
            runCnt += 1
            if(runCnt == total){
              let timestamp = new Date()
              console.log("=======================")
              console.log("vpp module finish")
              console.log("=======================")
              cb()
            }
          })
          .catch(() => {
            console.log("ERROR, ", myCmdLine)
          })
      })
    }
  } else {
    console.log('ERROR, please specify rigth module dir\n')
  }
})

function getVppCmdListFromTag(flistTag:string, moduleFlistConfigList:any[], rtlRootDir:string, exportDir:string){
  let cmdList = []
  for(let item of moduleFlistConfigList){
    const RTLFlist = []
    if(item.isVppreproc){
      for(let flistLine of item.flist){
        if(flistLine.path != ''){
          if(flistLine.tags.includes(flistTag)){
            RTLFlist.push(getFullPath(Path.resolve(rtlRootDir), flistLine.path))
          }
        }
      }
      cmdList.push(...getVppreprocCmdLine(RTLFlist, item.suffix, exportDir))
    }
  }
  return cmdList
}

module.exports.init = function(program) {
  program.allowUnknownOption()
    .option('-w,--workDir <args>', 'specify work dir')
    .option('-m,--moduleDir <args>', 'specify module dir')
    .option('--force', 'delect old data, and rebuild')
}

module.exports.flowName='vppModule'

module.exports.setEnv = function(e) {
  let env = e

  flow = <VppModuleInterface>env.getFlow('vppModule')
  flow.projectDir = env.getOpt('global.projectDir', null)
  flow.rtlRootDir  = env.getOpt('global.rtlRootDir', null)

  const moduleDir = env.getOpt('vppModule.moduleDir', null)
  const workDir   = env.getOpt('vppModule.workDir', null)
  if((workDir != null) && (flow.moduleDir != null)){
    flow.workDir = workDir
    flow.moduleDir = getFullPath(process.env.PWD, flow.moduleDir)
  } else {
    flow.workDir = env.flow.global.workDir
    flow.moduleDir = getFullPath(flow.workDir, env.getOpt('vppModule.moduleDir', flow.workDir))
  }
  flow.vppBuildDir = toPath(flow.moduleDir, 'build/rtl_export')

  flow.isRebuild   = (env.getOpt('vppModule.force') != null) ? true : false
}

module.exports.getVppreprocCmdLine = getVppreprocCmdLine
module.exports.getVppOutFileBaseName = getVppOutFileBaseName
module.exports.getVppCmdListFromTag = getVppCmdListFromTag
