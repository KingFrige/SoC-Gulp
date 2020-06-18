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

import {VppFileInterface} from "../protocol/vppFileInterface"

let flow:VppFileInterface

function getModuleInfoFlist(moduleInfoFile:string){
  const moduleInfo = require(moduleInfoFile)

  const baseDir = Path.dirname(moduleInfoFile)
  let i = 0
  for(let itme of moduleInfo.flist){
    let j = 0
    for(let flist of itme.flist){
      moduleInfo.flist[i].flist[j].path = toPath(baseDir, moduleInfo.flist[i].flist[j].path)
      j++
    }
    i++
  }

  return moduleInfo.flist
}

gulp.task('gen:moduleFlConfig',(cb) => {
  if (flow.isRebuild && fs.existsSync(flow.moduleFlConfigFile)) {
    del.sync(flow.moduleFlConfigFile)
    console.log('remove ', flow.moduleFlConfigFile)
  }
  if(!fs.existsSync(Path.dirname(flow.moduleFlConfigFile))){
    mkdirp.sync(Path.dirname(flow.moduleFlConfigFile))
  }
  const moduleInfoList = []
  moduleInfoList.push(toPath(flow.moduleDir, 'module_info.json5'))

  genFLConfig(moduleInfoList, flow.moduleFlConfigFile)
    .then(()=> {
      console.log("============================")
      console.log("gen module flist config file ", flow.moduleFlConfigFile)
      console.log("============================")
      cb()
    })
})

gulp.task('gen:chipFlConfig',(cb)=>{
  if (fs.existsSync(flow.chipFlConfigFile)) {
    del.sync(flow.chipFlConfigFile)
    console.log('remove ', flow.chipFlConfigFile)
  }
  if(!fs.existsSync(Path.dirname(flow.chipFlConfigFile))){
    mkdirp.sync(Path.dirname(flow.chipFlConfigFile))
  }

  const moduleInfoList = glob.sync(`${toPath(flow.rtlRootDir, "**/module_info.json5")}`, { nodir: true })

  genFLConfig(moduleInfoList, flow.chipFlConfigFile)
    .then(()=> {
      console.log("============================")
      console.log("gen chip flist config file ", flow.chipFlConfigFile)
      console.log("============================")
      cb()
    })
})

function genFLConfig(moduleInfoList:string[], flConfigFile:string){
  return new Promise((resolve, reject) => {
    let busy = false
    return gulp.src(moduleInfoList)
      .pipe(newer({
        map: (path) => {
          return flConfigFile
        }
      }))
      .pipe(through.obj((chunk, enc, cb) => {
        if(busy){
          cb(null)
          return
        }
        busy = true

        const moduleFlistJSONList = []
        if(moduleInfoList.length > 0){
          for(let line of moduleInfoList){
            moduleFlistJSONList.push(...getModuleInfoFlist(line))
          }
        }

        const moduleFlistJSON = JSON5.stringify(moduleFlistJSONList, null, 2)
        fs.writeFileSync(flConfigFile, moduleFlistJSON, 'utf8')
        cb(null)
      }))
      .pipe(gulp.dest(Path.dirname(flConfigFile)))
      .on('end', () => {
        resolve(1)
      })
  })
}

module.exports.init = function(program) {
  program.allowUnknownOption()
    .option('-w,--workDir <args>', 'specify work dir')
    .option('-m,--moduleDir <args>', 'specify module dir')
    .option('--force', 'rebuild flow')
}

module.exports.flowName='vppFile'

module.exports.setEnv = function(e) {
  let env = e

  flow = <VppFileInterface>env.getFlow('vppFile')
  flow.projectDir = env.getOpt('global.projectDir', null)

  const moduleDir = env.getOpt('vppFile.moduleDir', null)
  const workDir   = env.getOpt('vppFile.workDir', null)
  if((workDir != null) && (flow.moduleDir != null)){
    flow.workDir = workDir
    flow.moduleDir = getFullPath(process.env.PWD, flow.moduleDir)
  } else {
    flow.workDir = env.flow.global.workDir
    flow.moduleDir = getFullPath(flow.workDir, env.getOpt('vppFile.moduleDir', flow.workDir))
  }

  flow.rtlRootDir  = env.getOpt('global.rtlRootDir', null)
  flow.chipFlConfigFile = env.getOpt('vppFile.chipFlConfigFile', toPath(flow.projectDir, 'config/json/rtl_config.json5'))
  flow.moduleFlConfigFile = env.getOpt('vppFile.moduleFlConfigFile', toPath(flow.moduleDir, 'build/json/rtl_config.json5'))

  flow.isRebuild = env.getOpt('vppFile.force', false)
}
