export {}
require('json5/lib/register')
const gulp = require('gulp')
const JSON5 = require('json5')
const fs = require('fs')
const del = require('rimraf')
const _ = require('lodash')
const log = require('fancy-log')
const Path = require('path')
const mkdirp = require('mkdirp')
const glob = require('glob')
const through = require('through2')
const Mustache = require('mustache')
const uuid = require('uuid/v1')
const newer = require('gulp-newer')

let {toPath,getFullPath, runCmdDetached, runCmd, delBuildDirAndFile} = require('sulp_utils')

import {VerifSimInterface} from "../protocol/verifSimInterface"

let flow:VerifSimInterface
let simProfile = null

function genFlistFileForSCBench(chipTargetFlistFile:string, flistFiles:any[], verifWorkDir:string, verifWorkName:string, rtlRootDir:string){
  let testBenchDir= toPath(verifWorkDir, 'testbench')

  let templateVars = {
    define: '+define+',
    incdir: '+incdir+',
    release: verifWorkName,
    verifWorkDir: verifWorkDir,
    TestBenchDir: testBenchDir,
    rtlRootDir: rtlRootDir
  }

  console.log("merge flistFiles =>", flistFiles)
  var targetFlist = ''
  for(var i of flistFiles){
    var tmpFlist = fs.readFileSync(i, 'utf8')
    targetFlist  += Mustache.render(tmpFlist,templateVars)
    // console.log("targetFlist =>", targetFlist)
  }

  let FlistTargetDir = Path.dirname(chipTargetFlistFile)
  if(!fs.existsSync(FlistTargetDir)){
    mkdirp.sync(FlistTargetDir)
  }

  fs.writeFileSync(chipTargetFlistFile, targetFlist, 'utf8')

  return new Promise((resolve)=>{
    console.log("")
    console.log("NOTE: gen chip verif flist file!")
    console.log(chipTargetFlistFile)
    console.log("")
    resolve()
  })
}

gulp.task('_mergeASICSimFl', () =>{
  let asicSimDutFlist = []
  if(flow.asicDutFlists.length == 0){
    if(flow.post || flow.pre){
      asicSimDutFlist.push(...flow.asicNetlistFlists)
    } else {
      asicSimDutFlist.push(toPath(flow.vppRTLExportDir, 'asic_sim_dut.f'))
    }
  }

  const flistFiles = flow.asicChipFlistFiles
  const targetFlistFile = flow.chipTargetFlistFile

  const testBenchDir = toPath(flow.verifWorkDir, 'testbench')
  const testbenchFlist = glob.sync(`${toPath(testBenchDir, "**/**")}`, { nodir: true })
  const genAsicSimFlistSrc = testbenchFlist
  if(flow.flist){
    flistFiles.push(flow.flist)
    genAsicSimFlistSrc.push(flow.flist)
  } else {
    flistFiles.push(...asicSimDutFlist)
    genAsicSimFlistSrc.push(...flistFiles)
  }

  let busy = false
  return gulp.src(genAsicSimFlistSrc)
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

      // gen chipTargetFlistFile
      genFlistFileForSCBench(targetFlistFile, flistFiles, flow.verifWorkDir, flow.verifWorkName, flow.rtlRootDir)
      cb()
    }))
    .pipe(gulp.dest(Path.dirname(flow.chipTargetFlistFile)))
})

gulp.task('gen:asicRTLSimFl', gulp.series('gen:asicSimdutFl', '_mergeASICSimFl'))
gulp.task('gen:asicNetSimFl', gulp.series('_mergeASICSimFl'))

gulp.task('gen:fpgaSimFl', gulp.series('gen:fpgaSimdutFl', () =>{
  let fpgaSimDutFlist = []
  if(flow.fpgaDutFlists.length == 0){
    fpgaSimDutFlist.push(toPath(flow.vppRTLExportDir, 'fpga_sim_dut.f'))
  }

  const flistFiles = flow.fpgaChipFlistFiles
  const targetFlistFile = flow.chipTargetFlistFile

  const testBenchDir = toPath(flow.verifWorkDir, 'testbench')
  const testbenchFlist = glob.sync(`{${toPath(testBenchDir, "**/*.sv")}, ${toPath(testBenchDir, "**/*.v")}, ${toPath(testBenchDir, "**/*.f")}}`)
  const genFpgaSimFlistSrc = testbenchFlist
  if(flow.flist){
    flistFiles.push(flow.flist)
    genFpgaSimFlistSrc.push(flow.flist)
  } else {
    flistFiles.push(...fpgaSimDutFlist)
    genFpgaSimFlistSrc.push(...flistFiles)
  }

  let busy = false
  return gulp.src(genFpgaSimFlistSrc)
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
      console.log("gen fpga sim file -> updated file :", chunk.path)

      // gen chipTargetFlistFile
      genFlistFileForSCBench(targetFlistFile, flistFiles, flow.verifWorkDir, flow.verifWorkName, flow.rtlRootDir)
      cb()
    }))
    .pipe(gulp.dest(Path.dirname(flow.chipTargetFlistFile)))
}))

gulp.task('gen:asicSimDummyFl', gulp.series('gen:dutFl', () =>{
  const asicSimDummyDutFile = toPath(flow.vppRTLExportDir, 'dummy_dut.f')
}))
gulp.task('gen:fpgaSimDummyFl', gulp.series('gen:dutFl', () =>{
  // syn + dummy
}))


gulp.task('_elabBuild', () => {
  //---------record log info start--------------//
  const elabRunFieldJSONFile = toPath(flow.elabRunFieldPlaceDir, 'elabRunRecord.json5')
  let elabRunFieldJSON = []
  if(fs.existsSync(elabRunFieldJSONFile)){
    elabRunFieldJSON = require(elabRunFieldJSONFile)
  }

  let elabRunField = { // initial status
    "casePath": flow.caseDir,
    "vlogLog": "",
    "elabLog": "",
    "elabStatus": "running"  // finish, running, idle, fail
  } 
  //---------record log info end-----------------//

  if (flow.isRebuild && fs.existsSync(flow.elabBuildDir)) {
    del.sync(flow.elabBuildDir)
    console.log('remove ', flow.elabBuildDir)
  }

  let elabTimestampLog = Path.resolve(flow.elabBuildDir+'/elab_timestamp.log')

  let simFlist = flow.chipTargetFlistFile
  const designFlist:string[] = [simFlist]

  const otherElabInputFile = [] 
  if(fs.existsSync(flow.groupConfigFile)){
    otherElabInputFile.push(flow.groupConfigFile)
  }
  if(fs.existsSync(flow.caseConfigFile)){ // case config.js
    otherElabInputFile.push(flow.caseConfigFile)
  }
  if(fs.existsSync(flow.elabArgsFile)){ 
    otherElabInputFile.push(flow.elabArgsFile)
  }

  let elabInputSourceFiles = designFlist.concat(otherElabInputFile)

  let elabLogFile = toPath(flow.elabBuildDir, 'elab.log')
  let busy = false
  // console.log("elabInputSourceFiles[0] = ", elabInputSourceFiles[0])
  return gulp.src(elabInputSourceFiles)
    .pipe(newer({
      map: (path) => {
        return elabTimestampLog
      }
    }))
    .pipe(through.obj((chunk, enc, cb) => {
      // if find a new file, set busy
      if(busy){
        cb(null)
        return
      }
      busy = true

      if (!fs.existsSync(flow.elabBuildDir)){
        mkdirp.sync(flow.elabBuildDir)
      }

      //---------record log info start--------------//
      elabRunFieldJSON.push(elabRunField)
      let elabRunFieldJSONStr = JSON5.stringify(elabRunFieldJSON, null, 2)
      fs.writeFileSync(elabRunFieldJSONFile, elabRunFieldJSONStr, 'utf8')
      //---------record log info end-----------------//
      
      let caseAssetsPath = toPath(flow.caseDir, 'assets')
      if (fs.existsSync(caseAssetsPath)) {
        let assetstargetLinkPath = toPath(flow.elabBuildDir, 'assets');  // link to elabBuildDir
        del.sync(assetstargetLinkPath)
        fs.symlinkSync(caseAssetsPath, assetstargetLinkPath)
      }

      console.log("elab -> updated file :", chunk.path)
      simProfile.elabPlan.elabArgs.setFlistFile(flow.chipTargetFlistFile)
      simProfile.elabPlan.elabArgs.setCaseDir(flow.caseDir)
      simProfile.elabPlan.elabArgs.setElabBuildDir(flow.elabBuildDir)
      simProfile.elabPlan.elabArgs.setSimulatorCmdArgs(flow.simulatorCmdArgs)
      simProfile.elabPlan.elabArgs.setBenchTopName(flow.benchTopName)
      simProfile.elabPlan.elabArgs.setElabQuiet(flow.quiet)
      simProfile.elabPlan.elabArgs.setElabPost(flow.post)
      simProfile.elabPlan.elabArgs.setElabSDF(flow.SDF)
      simProfile.elabPlan.elabArgs.setElabTcl(flow.elabTcl)

      const ret = simProfile.elabPlan.run()

      console.log("============================")
      console.log("start elabration: ", flow.groupName, "goup...")
      console.log("============================")
      return runCmd(ret.cmd, ret.args, ret.cdw).then(function() {
        console.log("============================")
        console.log("elab finished")
        console.log("============================")
        let timestamp = new Date()
        fs.appendFileSync(elabTimestampLog, "\n============================\n", 'utf8')
        fs.appendFileSync(elabTimestampLog, timestamp, 'utf8')
        fs.appendFileSync(elabTimestampLog, "\n============================\n", 'utf8')
        fs.appendFileSync(elabTimestampLog, "\n\n\n", 'utf8')

        //---------record log info start--------------//
        elabRunField = {
          "casePath": flow.caseDir,
          "vlogLog": toPath(flow.elabBuildDir, 'vlog.log'),
          "elabLog": toPath(flow.elabBuildDir, 'elab.log'),
          "elabStatus": "finish"
        } 
        elabRunFieldJSON.pop()
        elabRunFieldJSON.push(elabRunField)

        elabRunFieldJSON = JSON5.stringify(elabRunFieldJSON, null, 2)
        fs.writeFileSync(elabRunFieldJSONFile, elabRunFieldJSON, 'utf8')
        //---------record log info end-----------------//

        cb(null)
      }).catch(function(){
        // if error, don't update elabTimestampLog
        console.log("")
        console.log("ERROR! log dir:", flow.elabBuildDir)
        console.log("")

        //---------record log info start--------------//
        elabRunField = {
          "casePath": flow.caseDir,
          "vlogLog": toPath(flow.elabBuildDir, 'vlog.log'),
          "elabLog": toPath(flow.elabBuildDir, 'elab.log'),
          "elabStatus": "fail"
        } 
        elabRunFieldJSON.pop()
        elabRunFieldJSON.push(elabRunField)

        elabRunFieldJSON = JSON5.stringify(elabRunFieldJSON, null, 2)
        fs.writeFileSync(elabRunFieldJSONFile, elabRunFieldJSON, 'utf8')
        //---------record log info end-----------------//


        throw new Error(`Can not finish elab, pleace check log file:`)
        cb(null)
      })
    }))
    .pipe(gulp.dest(flow.elabBuildDir))
})


gulp.task('_simBuild', () => {
  //---------record log info start--------------//
  const simRunFieldJSONFile = toPath(flow.simRunFieldPlaceDir, 'simRunRecord.json5')
  let simRunFieldJSON = []
  if(fs.existsSync(simRunFieldJSONFile)){
    del.sync(simRunFieldJSONFile)
  }

  let simRunField = { // initial status
    "casePath": flow.caseDir,
    "simLog": "",
    "simStatus": "running",  // finish, running, idle, fail
  }
  //---------record log info end-----------------//


  if (flow.isRebuild && fs.existsSync(flow.simBuildDir)) {
    del.sync(flow.simBuildDir)
    console.log('remove ', flow.simBuildDir)
  }

  let elabLogFile = toPath(flow.elabBuildDir, 'elab.log')
  let simInputSourceFile = [elabLogFile]
  let testcaseSO  = ''
  if(fs.existsSync(flow.testcaseSO)){
    testcaseSO  = flow.testcaseSO
    simInputSourceFile.push(testcaseSO)
  }


  if(fs.existsSync(flow.runArgsFile)){ 
    simInputSourceFile.push(flow.runArgsFile)
  }

  let simLogFile  = toPath(flow.simBuildDir, 'sim.log')

  let busy = false
  return gulp.src(simInputSourceFile)
    .pipe(newer({
      map: (path) => {
        return simLogFile
      }
    }))
    .pipe(through.obj((chunk, enc, cb) => {
      // if find a new file, set busy
      if(busy){
        cb(null)
        return
      }
      busy = true

      if (!fs.existsSync(flow.simBuildDir)) {
        mkdirp.sync(flow.simBuildDir)
      }

      //---------record log info start--------------//
      simRunFieldJSON.push(simRunField)
      let simRunFieldJSONStr = JSON5.stringify(simRunFieldJSON, null, 2)
      fs.writeFileSync(simRunFieldJSONFile, simRunFieldJSONStr, 'utf8')
      //---------record log info end-----------------//

      let caseDir = flow.caseDir
      let caseAssetsPath = toPath(caseDir, 'assets')
      if (fs.existsSync(caseAssetsPath)) {
        let assetstargetLinkPath = toPath(flow.simBuildDir, 'assets');  // link to simBuildDir
        del.sync(assetstargetLinkPath)
        fs.symlinkSync(caseAssetsPath, assetstargetLinkPath)
      }

      simProfile.simPlan.simArgs.setProjectDir(flow.verifWorkDir)
      simProfile.simPlan.simArgs.setCaseDir(flow.caseDir)
      simProfile.simPlan.simArgs.setElabBuildDir(flow.elabBuildDir)
      simProfile.simPlan.simArgs.setSimBuildDir(flow.simBuildDir)
      simProfile.simPlan.simArgs.setSimulatorCmdArgs(flow.simulatorCmdArgs)
      simProfile.simPlan.simArgs.setTestcaseSO(testcaseSO)
      simProfile.simPlan.simArgs.setGroupName(flow.groupName)
      simProfile.simPlan.simArgs.setSimTcl(flow.simTcl)
      simProfile.simPlan.simArgs.setDumpScript(flow.dumpScript)
      simProfile.simPlan.simArgs.setIsNotDumpWave(flow.isNotDumpWave)
      simProfile.simPlan.simArgs.setSimCoverage(flow.simCoverage)
      simProfile.simPlan.simArgs.setSimQuiet(flow.quiet)
      simProfile.simPlan.simArgs.setSimPost(flow.post)

      let ret = simProfile.simPlan.run()

      console.log("============================")
      console.log("start simulation: ", Path.basename(caseDir)+'...')
      console.log("============================")
      return runCmd(ret.cmd, ret.args, flow.simBuildDir).then(function() {
        console.log("============================")
        console.log("simulation finished")
        console.log("============================")
        console.log("log dir:", flow.simBuildDir)
        console.log("")

        //---------record log info start--------------//
        simRunField = {
          "casePath": flow.caseDir,
          "simLog": toPath(flow.simBuildDir, 'sim.log'),
          "simStatus": "finish",  // finish, running, idle, fail
        }
        simRunFieldJSON.pop()
        simRunFieldJSON.push(simRunField)

        let simRunFieldJSONStr = JSON5.stringify(simRunFieldJSON, null, 2)
        fs.writeFileSync(simRunFieldJSONFile, simRunFieldJSONStr, 'utf8')
        //---------record log info end-----------------//

        cb()
      }).catch(function(error){
        console.error(">>> error >>> ", error)
        console.log("")
        console.log("ERROR! log dir:", flow.simBuildDir)
        console.log("")

        //---------record log info start--------------//
        simRunField = {
          "casePath": flow.caseDir,
          "simLog": toPath(flow.simBuildDir, 'sim.log'),
          "simStatus": "fail",  // finish, running, idle, fail
        }
        simRunFieldJSON.pop()
        simRunFieldJSON.push(simRunField)
        let simRunFieldJSONStr = JSON5.stringify(simRunFieldJSON, null, 2)
        fs.writeFileSync(simRunFieldJSONFile, simRunFieldJSONStr, 'utf8')
        //---------record log info end-----------------//

        cb()
      })
    }))
    .pipe(gulp.dest(flow.simBuildDir))
})


gulp.task('runfpga:elab', gulp.series('gen:fpgaSimFl', '_elabBuild'))
gulp.task('runfpga:sim', gulp.series('build:sccase', 'runfpga:elab', '_simBuild'))
gulp.task('runfpga:cpusim', gulp.series('build:cpucase', 'runfpga:sim'))

gulp.task('run:elab', gulp.series('gen:asicRTLSimFl', '_elabBuild'))
gulp.task('run:elabNet', gulp.series('gen:asicNetSimFl', '_elabBuild'))

gulp.task('_directRunSCcaseSim', gulp.series('build:sccase', '_simBuild'))
gulp.task('_directRunCPUcaseSim', gulp.series('build:cpucase', '_simBuild'))

gulp.task('run:vsim', gulp.series('run:elab', '_simBuild'))
gulp.task('run:sim', gulp.series('build:sccase', 'run:elab', '_simBuild'))
gulp.task('run:simNet', gulp.series('build:sccase', 'run:elabNet', '_simBuild'))
gulp.task('run:cpusim', gulp.series('build:cpucase', 'run:elab', '_simBuild'))
gulp.task('run:cpusimNet', gulp.series('build:cpucase', 'run:elabNet', '_simBuild'))


gulp.task('clean:sim', gulp.series('clean:vppRun', 'clean:case', () => {
  const elabBuildDir = flow.elabBuildDir
  const simBuildDir  = flow.simBuildDir

  if(flow.purgeAll){
    const localBuildDir = toPath(flow.verifWorkDir, 'testcase', "localBuild") 
    delBuildDirAndFile(localBuildDir)

    const runCmdLogFileList = glob.sync(`${toPath(flow.verifWorkDir, "**/runCmdLogFile.log")}`)
    _.map(runCmdLogFileList, function(runCmdFile){
      delBuildDirAndFile(runCmdFile)
    })

    const chipTargetFlistFileList = glob.sync(`${toPath(flow.verifWorkDir, "**/chip_sim_flist.f")}`)
    _.map(chipTargetFlistFileList, function(flist){
      delBuildDirAndFile(flist)
    })

    const caseConfigList = glob.sync(`${toPath(flow.verifWorkDir, 'testcase', "**/config.js")}`)
    _.map(caseConfigList, function(caseConfig){
      const caseBuildDir = Path.dirname(caseConfig) + '/build'
      delBuildDirAndFile(caseBuildDir)
    })

    const localBuildList = glob.sync(`${toPath(flow.verifWorkDir, "**/localBuild")}`)
    _.map(localBuildList, function(localBuild){
      delBuildDirAndFile(localBuild)
    })
  } else {
    delBuildDirAndFile(elabBuildDir)
    delBuildDirAndFile(simBuildDir)
  }

  delBuildDirAndFile(flow.chipTargetFlistFile)

  return new Promise(function(resolve) {
    return resolve(1) 
  })
}))

gulp.task('_simArgs', () =>{
  return new Promise(function(resolve) {
    return resolve(1) 
  })
})

module.exports.init = function(program) {
  program.allowUnknownOption()
    .option('--vlogArgs <args>', 'simulation vlog arguments')
    .option('--elabArgs <args>', 'simulation compile/elaboration arguments')
    .option('--elabArgsFile <args>', 'specify elaboration step arguments file, default is elabArgsFile')
    .option('--runArgs <args>', 'simulation run time arguments')
    .option('--runArgsFile <args>', 'specify simulation run time arguments file, default is runArgsFile')
    .option('--elabBuildDir <args>', 'elabration dir')
    .option('--simBuildDir <args>', 'simulation dir')
    .option('--genflName <args>', 'set gen flist name and path')
    .option('--flist <args>', 'sim flist file')
    .option('--pre', 'set netlist sim')
    .option('--post', 'set post sim')
    .option('--SDF <args>',  'set SDF in elab stage')
    .option('--force', 'rebuild sim')
    .option('--case <args>', 'specify testcase dir')
    .option('--caseso <args>', 'specify testcase shared object(SO) file')
    .option('--quiet', 'sim not stdout')
    .option('--elabTcl <args>', 'specify elab tcl')
    .option('--simTcl <args>', 'specify sim tcl')
    .option('--dump <args>', 'specify dump tcl')
    .option('--isNotDumpWave', 'specify no dump wave, defualt is dump')
    .option('--simCoverage', 'coverage')
    .option('--isFreeDir', 'custom elabBuildDir and simBuildDir')
    .option('--group <args>', 'set group name')
    .option('--purgeAll', 'clean all sim data')
    .option('--logFieldPlaceDir <args>', 'specify the JSON file that record log info place Dir')
}

module.exports.flowName='sim'

module.exports.setEnv = function(e) {
  let env = e

  flow = <VerifSimInterface>env.getFlow('sim')
  simProfile = env.useProfile('sim')

  flow.verifWorkDir = env.getOpt('global.verifWorkDir', null)
  flow.rtlRootDir   = env.getOpt('global.rtlRootDir', null)
  flow.vppRTLExportDir = env.getOpt('vppRun.vppRTLExportDir', toPath(flow.rtlRootDir, 'export'))
  flow.verifWorkName = env.getOpt('global.verifWorkName', null)

  flow.benchTopName = env.getOpt('global.benchTopName')

  flow.workDir = env.flow.global.workDir 

  flow.case      = env.getOpt('sim.case', null)
  flow.caseDir   = simProfile.simPlan.simArgs.getCaseDir()
  const caseName = Path.basename(flow.caseDir)

  const caseRelativeWorkDirPath = flow.caseDir.split('/').slice(flow.workDir.split('/').length).join('/')

  // require testcase config.js
  flow.caseConfigFile = toPath(flow.caseDir, 'config.js')
  // console.log("flow.caseDir = ", flow.caseDir)
  let caseConfig = null
  if(fs.existsSync(flow.caseConfigFile)){ // case config.js
    caseConfig =require(flow.caseConfigFile)
  }

  // get group name
  let groupName = env.getOpt('sim.group', null)
  if(groupName != null){  // cmd line
    flow.groupName = groupName
  } else if(caseConfig != null){ // case config.js
    if(typeof(caseConfig.group) != "undefined"){
      flow.groupName = caseConfig.group
    }
    else{
      flow.groupName = 'default'
    }
  } else {
    flow.groupName = 'default'
  }

  flow.flist = env.getOpt('sim.flist', null)
  flow.asicDutFlists = env.getOpt('sim.asicDutFlists', [])
  flow.fpgaDutFlists = env.getOpt('sim.fpgaDutFlists', [])
  flow.asicTBFlists  = env.getOpt('sim.asicTBFlists', [])
  flow.fpgaTBFlists  = env.getOpt('sim.fpgaTBFlists', [])

  flow.asicChipFlistFiles  = [...flow.asicTBFlists, ...flow.asicDutFlists] 
  flow.fpgaChipFlistFiles  = [...flow.fpgaTBFlists, ...flow.fpgaDutFlists] 

  // pre
  flow.pre = env.getOpt('sim.pre', false)
  // post
  flow.post = env.getOpt('sim.post', false)
  const SDFFile = env.getOpt('sim.SDF', null)
  if(SDFFile != null){
    flow.SDF  = getFullPath(flow.workDir, SDFFile)
  }
  flow.asicNetlistFlists = env.getOpt('sim.asicNetlistFlists', null)

  // group define
  flow.groupConfigFile = toPath(flow.verifWorkDir, 'group.ts')
  let groupCfg = null
  if(fs.existsSync(flow.groupConfigFile)){
    const groupFilePath = require(flow.groupConfigFile)
    groupCfg = groupFilePath[flow.groupName]
  }

  let groupVlogArgs:string = ''
  if (((groupCfg != null ? groupCfg.vdef : void 0) != null) && groupCfg.vdef.trim() !== '') {
    let vdefList = groupCfg.vdef.split(/,/)
    groupVlogArgs += _.map(vdefList, (n) => {return `+define+${n}`}).join(',')
  }
  flow.groupArgs = groupVlogArgs

  // timeout
  let timeoutArgs:string = ''
  if(caseConfig != null){ // case config.js
    if(typeof(caseConfig.timeoutMS) != "undefined"){
      timeoutArgs = "+timeout_ms=" + caseConfig.timeoutMS
    } else {
      timeoutArgs = "+timeout_ms=" + '10'
    }
  }

  let elabArgsFileName = env.getOpt('sim.elabArgsFile', 'elabArgsFile') 
  const elabArgsFile = getFullPath(flow.caseDir, elabArgsFileName)
  flow.elabArgsFile = elabArgsFile
  let elabArgsFileList = []
  if(fs.existsSync(elabArgsFile)){
    elabArgsFileList = fs.readFileSync(elabArgsFile, 'utf8').split(/\n/)
  }
  let elabArgsFileListStr = elabArgsFileList.join(',')

  let runArgsFileName = env.getOpt('sim.runArgsFile', 'runArgsFile') 
  const runArgsFile = getFullPath(flow.caseDir, runArgsFileName)
  flow.runArgsFile = runArgsFile
  let runArgsFileList = []
  if(fs.existsSync(runArgsFile)){
    runArgsFileList = fs.readFileSync(runArgsFile, 'utf8').split(/\n/)
  }
  let runArgsFileListStr = runArgsFileList.join(',')

  let vlogArgs = env.getOpt('sim.vlogArgs', '') + "," + groupVlogArgs
  let elabCmdArgs = env.getOpt('sim.elabArgs', '') + "," + elabArgsFileListStr
  let runArgs  =  env.getOpt('sim.runArgs', '') + "," + timeoutArgs + "," + runArgsFileListStr
  vlogArgs = vlogArgs.replace(/^,/, '').replace(/,\s+,/, ',').replace(/,$/, '')
  elabCmdArgs = elabCmdArgs.replace(/^,/, '').replace(/,\s+,/, ',').replace(/,$/, '')
  runArgs  = runArgs.replace(/^,/,'').replace(/,\s+,/, ',').replace(/,$/, '')
  // console.log('vlogArgs = ', vlogArgs)
  // console.log('elabCmdArgs = ', elabCmdArgs)
  // console.log('runArgs = ', runArgs)
  flow.simulatorCmdArgs = {
    vlogArgs : vlogArgs,
    elabArgs : elabCmdArgs,
    runArgs  : runArgs
  }

  // gen build dir
  let elabBuildDir = env.getOpt('sim.elabBuildDir', null)
  let simBuildDir  = env.getOpt('sim.simBuildDir', null)
  let simGroup = 'sim_' + flow.groupName
  let isFreeDir = env.getOpt('sim.isFreeDir', false) 
  let simFlistFile = 'chip_sim_flist.f'
  if(isFreeDir){
    if((elabBuildDir != null) ){
      flow.elabBuildDir = getFullPath(flow.workDir, elabBuildDir)
      simFlistFile = toPath(flow.elabBuildDir, 'chip_sim_flist.f')
      if(simBuildDir != null){
        flow.simBuildDir  = getFullPath(flow.workDir, simBuildDir)
      }
      else {
        flow.simBuildDir  = flow.elabBuildDir
      }
    } else {
      console.error("EROOR: Please set elab directory!")
      process.exit()
    }
  } else {
    if(elabBuildDir != null){
      flow.elabBuildDir = toPath(getFullPath(flow.workDir, elabBuildDir), simGroup, 'com')
      if(simBuildDir != null){
        flow.simBuildDir  = toPath(getFullPath(flow.workDir, simBuildDir), simGroup, 'run', caseRelativeWorkDirPath)
      } else {
        flow.simBuildDir  = toPath(getFullPath(flow.workDir, elabBuildDir), simGroup, 'run',caseRelativeWorkDirPath)
      }
    } else if(flow.case != null){
      flow.elabBuildDir = toPath(flow.workDir, 'localBuild', simGroup, 'com')
      flow.simBuildDir  = toPath(flow.workDir, 'localBuild', simGroup, 'run', caseRelativeWorkDirPath)
    } else {
      // case dir is workDir, no group
      flow.elabBuildDir = toPath(flow.workDir, 'build/com') 
      flow.simBuildDir  = toPath(flow.workDir, 'build/run')
    }
    simFlistFile = toPath(Path.dirname(flow.elabBuildDir), 'chip_sim_flist.f')
  }

  flow.elabRunFieldPlaceDir = flow.elabBuildDir
  flow.simRunFieldPlaceDir  = flow.simBuildDir
  const logFieldPlaceDir = env.getOpt('sim.logFieldPlaceDir', null)
  if(logFieldPlaceDir != null){
    flow.elabRunFieldPlaceDir = logFieldPlaceDir
    flow.simRunFieldPlaceDir  = logFieldPlaceDir
  }


  let coustomFlist = env.getOpt('sim.genflName', null)
  if (coustomFlist){
    flow.chipTargetFlistFile = getFullPath(flow.workDir, coustomFlist)
  }else {
    flow.chipTargetFlistFile = env.getOpt('sim.chipTargetFlistFile', simFlistFile)
  }

  let casesoPath   = env.getOpt('sim.caseso', null)
  let caseBuildDir = simProfile.simPlan.simArgs.getCaseBuildDir()
  if(casesoPath != null){          // specify test.so
    flow.testcaseSO = getFullPath(flow.workDir, casesoPath)
  } else {
    flow.testcaseSO =toPath(caseBuildDir, "test.so")
  } 

  flow.handle = {
    process: null,
    started: 0,
    finished: 0,
    watchList: env.watchList,
    log: '',
    message: ''
  }

  const elabTcl =  env.getOpt('sim.elabTcl', null)
  if(elabTcl != null){
    flow.elabTcl    = getFullPath(flow.caseDir, elabTcl)
  } else {
    flow.elabTcl    = null
  }
  const simTcl =  env.getOpt('sim.simTcl', null)
  if(simTcl != null){
    flow.simTcl    = getFullPath(flow.caseDir, simTcl)
  } else {
    flow.simTcl    = null
  }

  let defaultDumpScript = toPath(flow.caseDir, 'dump.tcl')
  flow.dumpScript    = env.getOpt('sim.dump', defaultDumpScript)
  flow.isNotDumpWave    = env.getOpt('sim.isNotDumpWave', false)
  flow.simCoverage   = env.getOpt('sim.simCoverage', false)

  flow.isRebuild = env.getOpt('sim.force', env.getOpt('sim.isRebuild', false))
  flow.quiet = env.getOpt('sim.quiet', false)
  flow.purgeAll = env.getOpt('sim.purgeAll', false)
}
