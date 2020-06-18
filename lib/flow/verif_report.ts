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


let {toPath,getFullPath, runCmdDetached, runCmd, delBuildDirAndFile} = require('sulp_utils')

import {VerifReportInterface} from "../protocol/verifReportInterface"

let flow:VerifReportInterface

function findVlogElabLogError(logFile:string){
  const logFileContent = fs.readFileSync(logFile, 'utf8').split(/\n/)
  let errorFieldRecord = []

  for (let index = 0, len=logFileContent.length; index < len; index++) {
    let line = logFileContent[index]
    if (line.trim() !== '') {
      if (line.match(/E\*/) || line.match(/ERROR/)) {
        let errorInfo = ''
        if(index >= 2 && index < len-2){
          errorInfo += "\n"
          errorInfo += (index-2) + ": " + logFileContent[index-2] + "\n"
          errorInfo += (index-1) + ": " + logFileContent[index-1] + "\n"
          errorInfo += index + ": " + line + "\n"
          errorInfo += (index+1) + ": " + logFileContent[index+1] + "\n"
          errorInfo += (index+2) + ": " + logFileContent[index+2] + "\n"
          errorInfo += "\n"
        } else {
          errorInfo += "\n"
          errorInfo += index + ": " + line + "\n"
          errorInfo += "\n"
        }
        // console.log(errorInfo)

        let erroField = {
          "logPath": logFile,
          "line": index,
          "info": errorInfo
        }
        errorFieldRecord.push(erroField)
      } else {
      }
    }
  }

  return errorFieldRecord
}

function findSimLogError(simRunFieldLine:any){
  const simLogFile = simRunFieldLine.simLog
  const logFileContent = fs.readFileSync(simLogFile, 'utf8').split(/\n/)
  let errorFieldRecord = []

  if(typeof(simRunFieldLine.simStatus) != 'undefined'){
    if(simRunFieldLine.simStatus == 'finish'){
      for (let index = 0, len=logFileContent.length; index < len; index++) {
        let line = logFileContent[index]
        if (line.trim() !== '') {
          if (line.match(/E\*/) || line.match(/ERROR/i)) {
            let errorInfo = ''
            if(index >= 1 && index < len-1){
              errorInfo += "\n"
              errorInfo += (index-1) + ": " + logFileContent[index-1] + "\n"
              errorInfo += index + ": " + line + "\n"
              errorInfo += (index+1) + ": " + logFileContent[index+1] + "\n"
              errorInfo += "\n"
            } else {
              errorInfo += "\n"
              errorInfo += index + ": " + line + "\n"
              errorInfo += "\n"
            }
            // console.log(errorInfo)
            // console.log(line)

            let erroField = {
              "line": index,
              "info": errorInfo
            }
            errorFieldRecord.push(erroField)
          } else {
          }
        }
      }

      let simHasPassInfo = false

      for (let index = 0, len=logFileContent.length; index < len; index++) {
        let line = logFileContent[index]
        if(line.trim() !== '') {
          if(line.match(/Case.*PASS/)){
            // console.log("\n")
            // console.log("HAVE PASS INFO: ", line)
            // console.log("\n")
            simHasPassInfo = true
          }
        }
        if(index == (len-1) && !simHasPassInfo){
          console.log("\n>>>>>>>>>>>>>>>>>>>>>")
          console.log("Attention: NO HAVE PASS INFO, Please add PASS INFO in you testcase")
          console.log("<<<<<<<<<<<<<<<<<<<<<\n")
        }
      }

      return {
        "casePath"        : simRunFieldLine.casePath,
        "logPath"         : simLogFile,
        "simHasPassInfo"  : simHasPassInfo, 
        "errorFieldRecord": errorFieldRecord,
        "errorNumber"     : errorFieldRecord.length,
        "simStatus"       : 'finish'
      }
    }else{
      return {
        "casePath"        : simRunFieldLine.casePath,
        "logPath"         : simLogFile,
        "simHasPassInfo"  : false, 
        "simStatus"       : simRunFieldLine.simStatus
      }
    }
  } else {
    return {
      "casePath"        : simRunFieldLine.casePath,
      "logPath"         : simLogFile,
      "simHasPassInfo"  : false, 
      "simStatus"       : 'no-finish'
    }
  }
}

gulp.task('_reportElab',()=>{
  const elabReportLog = flow.elabReportLog 
  const elabRunFieldJSONFile = toPath(flow.elabRunFieldPlaceDir, 'elabRunRecord.json5')

  let elabRunFieldJSON 
  let elabReportLogJSON = []
  if(fs.existsSync(elabRunFieldJSONFile)){
    elabRunFieldJSON = require(elabRunFieldJSONFile)
  } else {
    console.log('no have ' + elabRunFieldJSONFile)
    console.log('Please run -> sim flow to ealb')
    process.exit()
  }

  for(let elabRunFieldLine of elabRunFieldJSON){
    let elabLogInfo = findVlogElabLogError(elabRunFieldLine.elabLog)

    elabReportLogJSON.push(elabLogInfo)
  }

  let elabReportLogJSONStr = JSON5.stringify(elabReportLogJSON, null, 2)
  fs.writeFileSync(elabReportLog, elabReportLogJSONStr, 'utf8')

  return new Promise((resolve)=>{
    resolve()
  })
})

gulp.task('_reportSim',()=>{
  const simReportLog  = flow.simReportLog 
  const simRunFieldJSONFile  = toPath(flow.simRunFieldPlaceDir, 'simRunRecord.json5')

  let simRunFieldJSON
  let simReportLogJSON = []

  if(fs.existsSync(simRunFieldJSONFile)){
    simRunFieldJSON  = require(simRunFieldJSONFile)

    if(fs.existsSync(simReportLog)){
      simReportLogJSON = require(simReportLog)
    }

    for(let simRunFieldLine of simRunFieldJSON){
      let simLogInfo = findSimLogError(simRunFieldLine)

      simReportLogJSON.push(simLogInfo)
    }
  } else {
    let simLogInfo = {
      "simRunRecordFile": simRunFieldJSONFile, 
      "simHasPassInfo"  : false, 
      "simStatus"       : 'non-finish'
    }
    simReportLogJSON.push(simLogInfo)

    console.log('no have ' + simRunFieldJSONFile)
    console.log('Please run -> sim flow to sim')
    process.exit()
  }


  let simReportLogJSONStr = JSON5.stringify(simReportLogJSON, null, 2)
  fs.writeFileSync(simReportLog, simReportLogJSONStr, 'utf8')

  return new Promise((resolve)=>{
    resolve()
  })
})

gulp.task('report:elab', gulp.series('_reportElab'))
gulp.task('report:log', gulp.series('_reportSim'))

gulp.task('report:sim', gulp.series('run:sim', '_reportSim'))
gulp.task('report:cpusim', gulp.series('run:cpusim', '_reportSim'))
gulp.task('reportfpga:sim', gulp.series('runfpga:sim', '_reportSim'))
gulp.task('reportfpga:cpusim', gulp.series('runfpga:cpusim', '_reportSim'))

gulp.task('show:simrpt', ()=>{
  const simSummaryLog  = toPath(flow.workDir, 'simSummary.log')

  let simReportLogContent
  if(fs.existsSync(flow.simReportLog)){
    simReportLogContent = require(flow.simReportLog)
  } else {
    console.log('no have ' + flow.simReportLog)
    console.log('Please run -> report:log to gen ' + flow.simReportLog)
    process.exit()
  }

  console.log('\n')

  let hasPASSCnt  = 0
  let hasERRORCnt = 0
  let finishCnt   = 0
  let noFinishCnt = 0
  for(let simReportLogLine of simReportLogContent){
    if(simReportLogLine.simStatus == 'finish'){
      console.log('hasPASS = %s | simStatus = %s | errorNumber = %d | %s', simReportLogLine.simHasPassInfo, simReportLogLine.simStatus, simReportLogLine.errorNumber, simReportLogLine.logPath)
      if(simReportLogLine.simHasPassInfo){
        hasPASSCnt += 1
      }
      if(simReportLogLine.errorNumber != 0){
        hasERRORCnt += 1
      }
      finishCnt += 1
    } else {
      console.log('hasPASS = %s | simStatus = %s   | errorNumber = %d | %s', simReportLogLine.simHasPassInfo, 'noFinish', simReportLogLine.errorNumber, simReportLogLine.logPath)
      noFinishCnt += 1
    }
  }
  console.log('\nsummary:')
  console.log('caseNum      : ', simReportLogContent.length)
  console.log('finishNum    : ', finishCnt)
  console.log('hasPASSNum   : ', hasPASSCnt)
  console.log('noHasPASSNum : ', (finishCnt - hasPASSCnt))
  console.log('hasERRORNum  : ', hasERRORCnt)
  console.log('noFinishNum  : ', noFinishCnt)
  console.log('PASS%        : %s %', (hasPASSCnt/simReportLogContent.length)*100)
  console.log('\n')

  return new Promise((resolve)=>{
    resolve()
  })
})


gulp.task('clean:report', () => {
  return new Promise(function(resolve) {
    delBuildDirAndFile(flow.elabReportLog) 
    delBuildDirAndFile(flow.simReportLog) 
    delBuildDirAndFile(toPath(flow.workDir, 'runCmdLogFile.log')) 

    return resolve(1) 
  })
})

module.exports.init = function(program) {
  program.allowUnknownOption()
    .option('--src <args>', 'specify JSON5 source file')
    .option('--rptOutputDir <args>', 'specify log file placement location dir')
}

module.exports.flowName='report'

module.exports.setEnv = function(e) {
  let env = e

  flow = <VerifReportInterface>env.getFlow('report')

  flow.workDir = env.flow.global.workDir 

  flow.src = env.getOpt('report.src', null)
  flow.simRunFieldPlaceDir = env.getOpt('sim.simRunFieldPlaceDir', null)
  flow.elabRunFieldPlaceDir = env.getOpt('sim.elabRunFieldPlaceDir', null)

  flow.reportOutputDir = env.getOpt('report.rptOutputDir', flow.workDir)

  flow.elabReportLog   = env.getOpt('report.elabReportLog', toPath(flow.reportOutputDir, 'elabReportFile.json5'))
  flow.simReportLog    = env.getOpt('report.simReportLog', toPath(flow.reportOutputDir, 'simReportFile.json5'))
}
