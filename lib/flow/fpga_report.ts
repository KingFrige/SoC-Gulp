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

import {FPGAReportInterface} from "../protocol/fpgaReportInterface"

let flow:FPGAReportInterface

gulp.task('report:fpgaPPA',()=>{
  return new Promise((resolve)=>{
    if(flow.name != null){
      console.log("FPGAReport,", flow.name)
    }
    resolve()
  })
})

gulp.task('report:fpgaStatus',()=>{
  return new Promise((resolve)=>{
    resolve()
  })
})


module.exports.init = function(program) {
  program.allowUnknownOption()
    .option('-n, --name <args>', 'name')
}

module.exports.flowName='fpgaReport'

module.exports.setEnv = function(e) {
  let env = e

  flow = <FPGAReportInterface>env.getFlow('fpgaReport')

  flow.name   = env.getOpt('fpgaReport.name', null)
}
