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

import {HelloInterface} from "../protocol/helloInterface"

let flow:HelloInterface

gulp.task('hello',()=>{
  return new Promise((resolve)=>{
    if(flow.name != null){
      console.log("Hello,", flow.name)
    } else {
      console.log("=================")
      console.log("Hello, typescript")
      console.log("=================")
    }
    resolve()
  })
})

gulp.task('hello:py',()=>{
  return new Promise((resolve)=>{
    const cmd = toPath('lib/scripts/python/hello.py')

    const args = []
    if(flow.name != null){
      args.push(flow.name)
    } else {
      args.push('')
    }

    const cwd = process.env.SULP_ROOT
    console.log("run dir >> ", cwd)

    return runCmd(cmd, args).then(function() {
      resolve()
    }).catch(function(){
      console.log("")
      console.log("ERROR! Please check code")
      console.log("")
      throw new Error(`Can not exe python script`)
    })
  })
})

gulp.task('hello:sh',()=>{
  return new Promise((resolve)=>{
    const cmd = toPath('lib/scripts/shell/hello.sh')

    const args = []
    if(flow.name != null){
      args.push(flow.name)
    } else {
      args.push('')
    }

    return runCmd(cmd, args).then(function() {
      resolve()
    }).catch(function(){
      console.log("")
      console.log("ERROR! Please check code")
      console.log("")
      throw new Error(`Can not exe shell script`)
    })
  })
})

gulp.task('hello:pl',()=>{
  return new Promise((resolve)=>{
    const cmd = toPath('lib/scripts/perl/hello.pl')

    const args = []
    if(flow.name != null){
      args.push(flow.name)
    } else {
      args.push('')
    }

    const cwd = process.env.SULP_ROOT
    console.log("run dir >> ", cwd)

    return runCmd(cmd, args, cwd).then(function() {
      resolve()
    }).catch(function(){
      console.log("")
      console.log("ERROR! Please check code")
      console.log("")
      throw new Error(`Can not exe perl script`)
    })
  })
})

module.exports.init = function(program) {
  program.allowUnknownOption()
    .option('-n, --name <args>', 'name')
}

module.exports.flowName='hello'

module.exports.setEnv = function(e) {
  let env = e

  flow = <HelloInterface>env.getFlow('hello')

  flow.name = env.getOpt('hello.name', null)
}
