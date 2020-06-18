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
const csvtojson= require('csvtojson')
const xlstojson= require('xls-to-json')


let {toPath,getFullPath, runCmdDetached, runCmd} = require('sulp_utils')

import {GitFileInterface} from "../protocol/gitFileInterface"

let flow:GitFileInterface

function csv2json5(inputCSV:string, outputJSON:string){
  return csvtojson()
    .fromFile(inputCSV)
    .then((jsonObj)=>{
      jsonObj = JSON5.stringify(jsonObj, null, 2)
      fs.writeFileSync(outputJSON, jsonObj, 'utf8')
      console.log("The file was saved!")
      console.log("Please check:", outputJSON)
      })
}

gulp.task('_csv2json5',()=>{
  if(!fs.existsSync(flow.repoCfgCSV)){
    console.log("")
    console.log("Please add --repoCfgCSV <args> to add repo config CSV file")
    console.log("")
    process.exit()
  }

  let busy = false
  return gulp.src(flow.repoCfgCSV)
    .pipe(newer({
      map: (path) => {
        return flow.repoCfgJSON
      }
    }))
    .pipe(through.obj((chunk, enc, cb) => {
      if(busy){
        cb(null)
        return
      }
      busy = true

      csv2json5(flow.repoCfgCSV, flow.repoCfgJSON).then( () => {
          cb(null)
        })
    }))
    .pipe(gulp.dest(Path.dirname(flow.repoCfgJSON)))
})

function xls2json5(inputXLS:string, outputJSON:string){
  return xlstojson({
    input: inputXLS,   // input xls
    output: outputJSON // output json     
  }, function(err, result) {
    if(err) {
      console.error(err)
    } else {
      console.log(result)

      const jsonObj = JSON5.stringify(result, null, 2)
      fs.writeFileSync(outputJSON, jsonObj, 'utf8')
    }
  })
}

gulp.task('_xls2json5',()=>{
  if(flow.repoCfgXLS == null){
    console.log("")
    console.log("Please add --repoCfgXLS <args> to add repo config xls/xlsx file")
    console.log("")
    process.exit()
  }

  let busy = false
  return gulp.src(flow.repoCfgXLS)
    .pipe(newer({
      map: (path) => {
        return flow.repoCfgJSON
      }
    }))
    .pipe(through.obj((chunk, enc, cb) => {
      if(busy){
        cb(null)
        return
      }
      busy = true

      xls2json5(flow.repoCfgXLS, flow.repoCfgJSON).then( () => {
          cb(null)
        })
    }))
    .pipe(gulp.dest(Path.dirname(flow.repoCfgJSON)))
})

function getInitCfgSubmoduleList(repoCfgJSON:string, projectDir:string){
  const result = []
  const repoCfgList = require(repoCfgJSON)
  for(let item of repoCfgList){
    if(item.submodule == 'True'){
      let args = []
      args.push("submodule")
      args.push("-q")
      args.push("add")

      if(item.branch != 'master'){
        args.push("-b")
        args.push(item.branch)
      }

      args.push(item.url)
      args.push(item.path)

      let cmdLine = {
        cmd : 'git',
        args: args,
        name: item.name,
        path: item.path,
        url : item.url,
        cwd : projectDir
      }
      result.push(cmdLine)
    }
  }
  return result 
}

function getCheckoutCfgSubmoduleList(repoCfgJSON:string, projectDir:string){
  const result = []
  const repoCfgList = require(repoCfgJSON)
  for(let item of repoCfgList){
    let args = []
    args.push("checkout")
    args.push("-q")
    args.push(item.branch)

    let cmdLine = {
      cmd : 'git',
      args: args,
      name: item.name,
      path: item.path,
      url : item.url,
      cwd : toPath(projectDir, item.path)
    }
    result.push(cmdLine)
  }
  return result 
}

function getPullCfgSubmoduleList(repoCfgJSON:string, projectDir:string){
  const result = []
  const repoCfgList = require(repoCfgJSON)
  for(let item of repoCfgList){
    let args = []
    args.push("pull")
    args.push("-q")
    args.push("origin")
    args.push(item.branch)

    let cmdLine = {
      cmd : 'git',
      args: args,
      name: item.name,
      path: item.path,
      url : item.url,
      cwd : toPath(projectDir, item.path)
    }
    result.push(cmdLine)
  }
  return result 
}

function getGitModuleSubmoduleList(projectDir:string){
  const result = []
  const gitModulesFile = toPath(projectDir, '.gitmodules')
  if(!fs.existsSync(gitModulesFile)){
    return result 
  }

  const submoduleInfoList = fs.readFileSync(gitModulesFile, 'utf8').split(/\[submodule/)
  for(let line of submoduleInfoList){
    const submoduleRegExp = new RegExp(`"(.*)"\]`)
    const pathRegExp = new RegExp(`path = (.*)\\n`)
    const urlRegExp  = new RegExp(`url = (.*)\\n`)
    if(line.match(submoduleRegExp)){
      let repoName = RegExp.$1

      let repoPath = null
      if(line.match(pathRegExp)){
        repoPath = RegExp.$1
      }

      let repoUrl = null
      if(line.match(urlRegExp)){
        repoUrl = RegExp.$1
      }

      const repoInfo = {
        name : repoName,
        path : repoPath,
        url  : repoUrl
      }

      result.push(repoInfo)
    }
  }

  return result 
}


function getRtlRootDirRepoList(rtlRootDir:string){
  const repoPathList = glob.sync(`${toPath(rtlRootDir, "*/.git")}`, { nodir: false})

  const result = _.map(repoPathList, function(repoPath){
    // console.log('>>> ', repoPath.split('/').slice(-3,-1))
    return repoPath.split('/').slice(-3,-1).join('/')
  })

  return result 
}

function exeGitInitialRepo(gitLogFile:string, rtlRootDir:string, repoCfgJSON:string, projectDir:string){
  const cmdList = getNewRTLSubmoduleList(rtlRootDir, repoCfgJSON, projectDir)

  if(cmdList.length == 0){
    console.log("")
    console.log("No repo needs to be initialized")
    console.log("")
    return
  } else {
    let exeCmd = new Promise(function(resolve, reject) {resolve(1)})
    const total = cmdList.length

    let runCnt = 0
    for(let cmdLine of cmdList){
      console.log(cmdLine.cmd, ...cmdLine.args)
      exeCmd = exeCmd.then(function() {
        return runCmd(cmdLine.cmd, cmdLine.args, cmdLine.cwd)
          .then(function(){
            const myCmdLine = cmdLine.cmd + cmdLine.args.join(" ") + "\n"
            fs.appendFileSync(gitLogFile, myCmdLine, 'utf8')
            console.log(cmdLine.cmd, ...cmdLine.args)
            runCnt += 1
            if(runCnt == total){
              let timestamp = new Date()
              fs.appendFileSync(gitLogFile, "\n=======================\n", 'utf8')
              fs.appendFileSync(gitLogFile, timestamp, 'utf8')
              fs.appendFileSync(gitLogFile, "\n=======================\n", 'utf8')
              fs.appendFileSync(gitLogFile, "\n\n\n", 'utf8')
              return
            }
          })
      })
    }
  }
}

gulp.task('clone:submodule',()=>{

  if(flow.repoCfgJSON == null){
    console.log("")
    console.log("Please add --repoCfgJSON <args> to add repo config JOSN5 file")
    console.log("")
    process.exit()
  }

  const gitLogFile = toPath(flow.rtlRootDir, 'gitLogFile.log')

  let busy = false
  return gulp.src(flow.repoCfgJSON)
    .pipe(newer({
      map: (path) => {
        return gitLogFile
      }
    }))
    .pipe(through.obj((chunk, enc, cb) => {
      if(busy){
        cb(null)
        return
      }
      busy = true

      exeGitInitialRepo(gitLogFile, flow.rtlRootDir, flow.repoCfgJSON, flow.projectDir)
      return cb(null)
    }))
    .pipe(gulp.dest(Path.dirname(flow.rtlRootDir)))
})


gulp.task('init:repo', gulp.series('_csv2json5', 'clone:submodule'))

gulp.task('show:initialRepo', ()=>{
  const newSubmoduleList = getNewRTLSubmoduleList(flow.rtlRootDir, flow.repoCfgJSON, flow.projectDir)
  const DeprecatedSubmoduleList = getDeprecatedRTLSubmoduleList(flow.rtlRootDir, flow.repoCfgJSON, flow.projectDir)

  if(newSubmoduleList.length >0){
    console.log("")
    console.log("New repo:")
    for(let item of newSubmoduleList){
      console.log("name :", item.name)
      console.log("path :", item.path)
      console.log("url  :", item.url)
      console.log("")
    }
  } else {
    console.log("")
    console.log("No repo needs to be initialized")
    console.log("")
  }

  if(DeprecatedSubmoduleList.length >0){
    console.log("")
    console.log("WARNNING: deprecated repo => ")
    for(let item of DeprecatedSubmoduleList){
      console.log("name :", item.name)
      console.log("path :", item.path)
      console.log("url  :", item.url)
      console.log("")
    }
  }

  return new Promise((resolve)=>{
    resolve()
  })
})

function getNewRTLSubmoduleList(rtlRootDir:string, repoCfgJSON:string, projectDir:string){
  const result = []
  const gitModuleExistsSubmoduleList = getGitModuleSubmoduleList(projectDir)
  const configSubmoduleList = getInitCfgSubmoduleList(repoCfgJSON, projectDir)

  const  existsSubmodulePathList = []
  for(let existsSubmoduleLine of gitModuleExistsSubmoduleList){
    existsSubmodulePathList.push(existsSubmoduleLine.path)
  }

  for(let item of configSubmoduleList){
    if(existsSubmodulePathList.includes(item.path)){
    } else{
      result.push(item)
    }
  }

  return result
}

function getDeprecatedRTLSubmoduleList(rtlRootDir:string, repoCfgJSON:string, projectDir:string){
  const result = []
  const gitModuleExistsSubmoduleList = getGitModuleSubmoduleList(projectDir)
  const configSubmoduleList = getInitCfgSubmoduleList(repoCfgJSON, projectDir)

  const  cfgSubmodulePathList = []
  for(let cfgSubmoduleLine of configSubmoduleList){
    cfgSubmodulePathList.push(cfgSubmoduleLine.path)
  }

  for(let item of gitModuleExistsSubmoduleList){
    if(cfgSubmodulePathList.includes(item.path)){
    } else{
      result.push(item)
    }
  }

  return result
}


gulp.task('show:oldRepo',()=>{
  return new Promise((resolve)=>{
    const needDelSubmoduleList = getNeedDelSubmoduleList(flow.rtlRootDir, flow.projectDir)

    console.log("")
    for(let repoPath of needDelSubmoduleList){
      console.log("repo need to be clean:", repoPath)
    }
    if(needDelSubmoduleList.length == 0){
      console.log("Congratulation! Repo is clean")
    }

    console.log("")

    resolve()
  })
})

function getNeedDelSubmoduleList(rtlRootDir:string, projectDir:string){
  const result = []
  const gitModuleExistsSubmoduleList = getGitModuleSubmoduleList(projectDir)
  const rtlRootDirExistsSubmoduleList = getRtlRootDirRepoList(rtlRootDir)

  const  existsSubmodulePathList = []
  for(let existsSubmoduleLine of gitModuleExistsSubmoduleList){
    existsSubmodulePathList.push(existsSubmoduleLine.path)
  }
  // console.log(">>> existsSubmodulePathList = ", existsSubmodulePathList)

  for(let repoPath of rtlRootDirExistsSubmoduleList){
    if(existsSubmodulePathList.includes(repoPath)){
    } else{
      result.push(repoPath)
    }
  }
  // console.log(">>> rtlRootDirExistsSubmoduleList = ", rtlRootDirExistsSubmoduleList)

  return result
}


gulp.task('show:repo', gulp.series('_csv2json5', 'show:oldRepo', 'show:initialRepo'))

gulp.task('update:submodule',()=>{

  if(flow.repoCfgJSON == null){
    console.log("")
    console.log("Please add --repoCfgJSON <args> to add repo config JOSN5 file")
    console.log("")
    process.exit()
  }

  const updateLogFile = toPath(flow.rtlRootDir, 'gitLogFile.log')

  exeGitCheckoutRepo(updateLogFile, flow.rtlRootDir, flow.repoCfgJSON, flow.projectDir)
  exeGitPullRepo(updateLogFile, flow.rtlRootDir, flow.repoCfgJSON, flow.projectDir)

  return new Promise((resolve)=>{
    resolve()
  })
})

gulp.task('update:repo', gulp.series('_csv2json5', 'update:submodule'))

function exeGitCheckoutRepo(gitLogFile:string, rtlRootDir:string, repoCfgJSON:string, projectDir:string){
  const cmdList = getCheckoutCfgSubmoduleList(repoCfgJSON, projectDir)

  let exeCmd = new Promise(function(resolve, reject) {resolve(1)})
  const total = cmdList.length

  let runCnt = 0
  for(let cmdLine of cmdList){
    exeCmd = exeCmd.then(function() {
      return runCmd(cmdLine.cmd, cmdLine.args, cmdLine.cwd)
        .then(function(){
          const myCmdLine = cmdLine.cmd + cmdLine.args.join(" ") + "\n"
          fs.appendFileSync(gitLogFile, myCmdLine, 'utf8')
          console.log(cmdLine.path + '=> ' + cmdLine.cmd, ...cmdLine.args)
          console.log('')
          runCnt += 1
          if(runCnt == total){
            let timestamp = new Date()
            fs.appendFileSync(gitLogFile, "\n=======================\n", 'utf8')
            fs.appendFileSync(gitLogFile, timestamp, 'utf8')
            fs.appendFileSync(gitLogFile, "\n=======================\n", 'utf8')
            fs.appendFileSync(gitLogFile, "\n\n\n", 'utf8')
            return
          }
        })
    })
  }
}

function exeGitPullRepo(gitLogFile:string, rtlRootDir:string, repoCfgJSON:string, projectDir:string){
  const cmdList = getPullCfgSubmoduleList(repoCfgJSON, projectDir)

  let exeCmd = new Promise(function(resolve, reject) {resolve(1)})
  const total = cmdList.length

  let runCnt = 0
  for(let cmdLine of cmdList){
    exeCmd = exeCmd.then(function() {
      return runCmd(cmdLine.cmd, cmdLine.args, cmdLine.cwd)
        .then(function(){
          const myCmdLine = cmdLine.cmd + cmdLine.args.join(" ") + "\n"
          fs.appendFileSync(gitLogFile, myCmdLine, 'utf8')
          console.log(cmdLine.path + '=> ' + cmdLine.cmd, ...cmdLine.args)
          console.log('')
          runCnt += 1
          if(runCnt == total){
            let timestamp = new Date()
            fs.appendFileSync(gitLogFile, "\n=======================\n", 'utf8')
            fs.appendFileSync(gitLogFile, timestamp, 'utf8')
            fs.appendFileSync(gitLogFile, "\n=======================\n", 'utf8')
            fs.appendFileSync(gitLogFile, "\n\n\n", 'utf8')
            return
          }
        })
    })
  }
}

module.exports.init = function(program) {
  program.allowUnknownOption()
    .option('--repoCfgCSV <args>', 'specify repo config file: cvs format')
    .option('--repoCfgJSON <args>', 'specify repo config file: JSON5 format')
}

module.exports.flowName='gitFile'

module.exports.setEnv = function(e) {
  let env = e

  flow = <GitFileInterface>env.getFlow('gitFile')
  flow.projectDir = env.getOpt('global.projectDir', null)
  flow.workDir    = env.flow.global.workDir
  flow.rtlRootDir = env.getOpt('global.rtlRootDir', null)

  const repoCfgXLSPath = env.getOpt('gitFile.repoCfgXLS', null)
  if(repoCfgXLSPath != null){
    flow.repoCfgXLS = getFullPath(flow.projectDir, repoCfgXLSPath)
  } else {
    flow.repoCfgXLS = 'config/proj_config/sft_aic2_proj_config.xlsx'
  }

  const repoCfgCSVPath = env.getOpt('gitFile.repoCfgCSV', null)
  if(repoCfgCSVPath != null){
    flow.repoCfgCSV = getFullPath(flow.projectDir, repoCfgCSVPath)
  } else {
    flow.repoCfgCSV = toPath(flow.workDir, 'config/proj_config/modules_used_in_project.csv')
  }

  const repoCfgJSONPath = env.getOpt('gitFile.repoCfgJSON', null)
  if(repoCfgJSONPath != null){
    flow.repoCfgJSON = getFullPath(flow.projectDir, repoCfgJSONPath)
  } else {
    flow.repoCfgJSON = toPath(flow.workDir, 'config/json/sft_aic2_proj_config.json5')
  }
}
