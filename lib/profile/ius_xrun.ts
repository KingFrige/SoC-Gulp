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

let {toPath,getFullPath} = require('sulp_utils')

function _elabArgs(){
  let _flistFile:string
  let _caseDir:string
  let _elabBuildDir:string
  let _simulatorInstallDir:string
  let _simulatorCmdArgs:any
  let _benchTopName:string
  let _elabQuiet:boolean
  let _elabPost:boolean
  let _elabSDF:string
  let _elabTcl:string

  return {
    setFlistFile: (flistFile: string) => {_flistFile = flistFile},
    setCaseDir: (caseDir:string) => {_caseDir = caseDir},
    setElabBuildDir: (elabBuildDir: string) => {_elabBuildDir = elabBuildDir},
    setSimulatorInstallDir: (simulatorInstallDir: string) => {_simulatorInstallDir = simulatorInstallDir},
    setSimulatorCmdArgs: (simulatorCmdArgs: any) => {_simulatorCmdArgs = simulatorCmdArgs},
    setBenchTopName: (benchTopName: string) => {_benchTopName = benchTopName},
    setElabQuiet: (elabQuiet: boolean) => {_elabQuiet = elabQuiet},
    setElabPost: (elabPost: boolean) => {_elabPost = elabPost},
    setElabSDF: (elabSDF: string) => {_elabSDF = elabSDF},
    setElabTcl: (elabTcl: string) => {_elabTcl = elabTcl},

    getFlistFile: () => {return _flistFile},
    getCaseDir: () => {return _caseDir},
    getElabBuildDir: () => {return _elabBuildDir},
    getSimulatiorInstallDir: () => {return _simulatorInstallDir},
    getSimulatorCmdArgs: () => {return _simulatorCmdArgs},
    getBenchTopName: () => {return _benchTopName},
    getScIusCompiler: () => {return toPath(_simulatorInstallDir, 'tools/bin/xmsc')},
    getElabQuiet: () => {return _elabQuiet},
    getElabPost: () => {return _elabPost},
    getElabSDF: () => {return _elabSDF},
    getElabTcl: () => {return _elabTcl},
  }
}

function elabPlan(){
  const elabArgs = _elabArgs()
  return{
    elabArgs:elabArgs,

    run: () => {
      const flistFile       = elabArgs.getFlistFile()
      const caseDir         = elabArgs.getCaseDir()
      const iusElabBuildDir = elabArgs.getElabBuildDir()
      const iusInstallDir   = elabArgs.getSimulatiorInstallDir()
      const iusCmdArgs      = elabArgs.getSimulatorCmdArgs()
      const benchTopName = elabArgs.getBenchTopName()
      const elabQuiet = elabArgs.getElabQuiet();
      const elabPost = elabArgs.getElabPost();
      const elabSDF = elabArgs.getElabSDF();
      const elabTcl = elabArgs.getElabTcl();

      let elabRunArgList = [] 
      let iusSCLibPath = `${iusInstallDir}/tools/systemc/lib/64bit/gnu`

      elabRunArgList.push('-licqueue ')
      elabRunArgList.push('-64bit')
      elabRunArgList.push('-sysv_ext .v,.sv,.vh')
      elabRunArgList.push('-log_xmelab elab.log')
      elabRunArgList.push('-log_xmvlog vlog.log')
      elabRunArgList.push('-elaborate')
      elabRunArgList.push('-noupdate')
      elabRunArgList.push('-access +rwc')
      elabRunArgList.push('-mccodegen')
      elabRunArgList.push('-mcmaxcores 8 -zlib 1 ')
      elabRunArgList.push('-vlogext .lib.src -vlogext .vp.nc ')
      elabRunArgList.push('-timescale 1ns/10ps')

      if(elabPost && elabSDF){
        elabRunArgList.push('-sdf_cmd_file ' + elabSDF)
      } else {
        elabRunArgList.push('-notimingchecks')
        elabRunArgList.push('-nospecify')
      }

      if(elabQuiet){
        elabRunArgList.push('-quiet')
        elabRunArgList.push('-nostdout')
      } 

      if (fs.existsSync(elabTcl)) {
        elabRunArgList.push('-input ' + getFullPath(caseDir, elabTcl))
      }

      if(iusCmdArgs.vlogArgs){
        let vlogArgsStr = iusCmdArgs.vlogArgs;
        let vlogArgList = vlogArgsStr.split(/,/)
        elabRunArgList.push(...vlogArgList)
      } 
      if(iusCmdArgs.elabArgs){
        let elabArgsStr = iusCmdArgs.elabArgs;
        let elabArgList = elabArgsStr.split(/,/)
        elabRunArgList.push(...elabArgList)
      } 
      elabRunArgList.push('-top ' + benchTopName)
      elabRunArgList.push('-f ' + flistFile)

      let elabRunargsFile = Path.resolve(iusElabBuildDir + '/xrun_elab.args')
      fs.writeFileSync(elabRunargsFile, elabRunArgList.join("\n"), 'utf8')

      return {
        cmd: 'xrun',
        args: ['-f', elabRunargsFile],
        cdw: iusElabBuildDir
      }
    }
  }
}

function _simArgs(){
  let _projectDir:string
  let _caseDir:string
  let _caseBuildDir:string
  let _elabBuildDir:string
  let _simBuildDir:string
  let _simulatorCmdArgs:any
  let _testcaseSO:string
  let _groupName:string
  let _simTcl:string
  let _dumpScript:string
  let _isNotDumpWave:boolean
  let _simCoverage:boolean
  let _simQuiet:boolean
  let _simPost:boolean

  return {
    setProjectDir: (projectDir:string) => {_projectDir = projectDir},
    setCaseDir: (caseDir:string) => {_caseDir = caseDir},
    setCaseBuildDir: (caseBuildDir:string) => {_caseBuildDir = caseBuildDir},
    setElabBuildDir: (elabBuildDir:string) => {_elabBuildDir = elabBuildDir},
    setSimBuildDir: (simBuildDir:string) => {_simBuildDir = simBuildDir},
    setSimulatorCmdArgs: (simulatorCmdArgs:any) => {_simulatorCmdArgs = simulatorCmdArgs},
    setTestcaseSO: (testcaseSO:string) => {_testcaseSO = testcaseSO},
    setGroupName: (groupName:string) => {_groupName = groupName},
    setSimTcl: (simTcl:string) => {_simTcl = simTcl},
    setDumpScript: (dumpScript:string) => {_dumpScript = dumpScript},
    setIsNotDumpWave: (isNotDumpWave:boolean) => {_isNotDumpWave = isNotDumpWave},
    setSimCoverage: (simCoverage:boolean) => {_simCoverage = simCoverage},
    setSimQuiet: (simQuiet:boolean) => {_simQuiet = simQuiet},
    setSimPost: (simPost:boolean) => {_simPost = simPost},

    getProjectDir: () => {return _projectDir},
    getCaseDir: () => {return _caseDir},
    getCaseBuildDir: () => {return _caseBuildDir},
    getElabBuildDir: () => {return _elabBuildDir},
    getSimBuildDir: () => {return _simBuildDir},
    getSimulatorCmdArgs: () => {return _simulatorCmdArgs},
    getTestcaseSO: () => {return _testcaseSO},
    getGroupName: () => {return _groupName},
    getSimTcl: () => {return _simTcl},
    getDumpScript: () => {return _dumpScript},
    getIsNotDumpWave: () => {return _isNotDumpWave},
    getSimCoverage: () => {return _simCoverage},
    getSimQuiet: () => {return _simQuiet},
    getSimPost: () => {return _simPost},
  }
}

function simPlan(){
  const simArgs = _simArgs()

  return{
    simArgs:simArgs,

    run: () => {
      const projectDir = simArgs.getProjectDir()
      const caseDir    = simArgs.getCaseDir()
      const iusElabBuildDir = simArgs.getElabBuildDir()
      const iusSimBuildDir  = simArgs.getSimBuildDir()
      const iusCmdArgs      = simArgs.getSimulatorCmdArgs()
      const testcaseSO      = simArgs.getTestcaseSO()
      const groupName       = simArgs.getGroupName()
      const simTcl          = simArgs.getSimTcl()
      const dumpScript      = simArgs.getDumpScript()
      const isNotDumpWave   = simArgs.getIsNotDumpWave()
      const simCoverage     = simArgs.getSimCoverage()
      const simQuiet        = simArgs.getSimQuiet()
      const simPost         = simArgs.getSimPost()

      var targetLinkDir

      let simINCALibsDir  = toPath(iusSimBuildDir, 'xcelium.d')
      let elabINCALibsDir = Path.resolve(iusElabBuildDir+'/xcelium.d')
      if(iusElabBuildDir != iusSimBuildDir){
        if(fs.existsSync(elabINCALibsDir)){
          del.sync(simINCALibsDir)
          fs.symlinkSync(elabINCALibsDir, simINCALibsDir)
        }
        else {
          console.log("Can not find valid snap lib", elabINCALibsDir)
          console.log("Please check ius version")
          throw new Error('Please check sulp run:elab')
        }
      }

      const simRunArgList = []
      simRunArgList.push('-l sim.log')
      simRunArgList.push('-64bit')
      simRunArgList.push('-save_run_history')
      simRunArgList.push('-R')
      simRunArgList.push('-run')
      simRunArgList.push('-unbuffered')
      simRunArgList.push('-xceligen on')
      simRunArgList.push('-stacksize 2048000')
      simRunArgList.push('-nontcglitch')
      simRunArgList.push('-zlib 1 ')
      simRunArgList.push('+model_data+./')

      if(!simPost){
        simRunArgList.push('-notimingchecks')
        simRunArgList.push('-nospecify')
      }

      if (simQuiet) {
        simRunArgList.push('-quiet')
        simRunArgList.push('-nostdout')
      }

      if (simCoverage) {
        simRunArgList.push(`-covtest ${uuid()}`)
      }

      if(iusCmdArgs.runArgs){
        let runArgsStr = iusCmdArgs.runArgs;
        let runArgList    = runArgsStr.split(/,/)
        simRunArgList.push(...runArgList);
      }

      let dumpScriptPath = getFullPath(caseDir, dumpScript)
      let dumpScriptName = Path.basename(dumpScriptPath)
      let simLoadDumpScript = toPath(iusSimBuildDir, dumpScriptName)
      if(fs.existsSync(simLoadDumpScript)) {
        del.sync(simLoadDumpScript)
      }
      if (fs.existsSync(dumpScriptPath) && (!isNotDumpWave)) {
        simRunArgList.push('+fsdb+parallel=on')
        fs.symlinkSync(dumpScriptPath, simLoadDumpScript)
        simRunArgList.push('-input dump.tcl')
      } 

      if (fs.existsSync(simTcl)) {
        simRunArgList.push('-input ' + getFullPath(caseDir, simTcl))
      }

      if (fs.existsSync(testcaseSO)) {
        let caseArgs = "+systemc_args+case="+testcaseSO
        simRunArgList.push(caseArgs)
      }

      let simRunargsFile = Path.resolve(iusSimBuildDir + '/xrun_sim.args')
      fs.writeFileSync(simRunargsFile, simRunArgList.join("\n"), 'utf8')

      return {
        cmd: 'xrun',
        args: ['-f', simRunargsFile],
        target: Path.resolve(iusSimBuildDir + '/sim.log'),
        cleans: ['sim.log'],
        links: ['sim.log']
      }
    }
  }
}

module.exports.elabPlan = elabPlan()
module.exports.simPlan = simPlan()
