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
  let _elabTcl:string

  return {
    setFlistFile: (flistFile: string) => {_flistFile = flistFile},
    setCaseDir: (caseDir:string) => {_caseDir = caseDir},
    setElabBuildDir: (elabBuildDir: string) => {_elabBuildDir = elabBuildDir},
    setSimulatorInstallDir: (simulatorInstallDir: string) => {_simulatorInstallDir = simulatorInstallDir},
    setSimulatorCmdArgs: (simulatorCmdArgs: any) => {_simulatorCmdArgs = simulatorCmdArgs},
    setBenchTopName: (benchTopName: string) => {_benchTopName = benchTopName},
    setElabQuiet: (elabQuiet: boolean) => {_elabQuiet = elabQuiet},
    setElabTcl: (elabTcl: string) => {_elabTcl = elabTcl},

    getFlistFile: () => {return _flistFile},
    getCaseDir: () => {return _caseDir},
    getElabBuildDir: () => {return _elabBuildDir},
    getSimulatiorInstallDir: () => {return _simulatorInstallDir},
    getSimulatorCmdArgs: () => {return _simulatorCmdArgs},
    getBenchTopName: () => {return _benchTopName},
    getScIusCompiler: () => {return toPath(_simulatorInstallDir, 'tools/bin/ncsc')},
    getElabQuiet: () => {return _elabQuiet},
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
      const elabTcl = elabArgs.getElabTcl();

      let elabRunArgList = [] 
      let iusSCLibPath = `${iusInstallDir}/tools/systemc/lib/64bit/gnu`

      elabRunArgList.push('-64bit')
      elabRunArgList.push('-sv')
      elabRunArgList.push('-log_ncelab elab.log')
      elabRunArgList.push('-log_ncvlog vlog.log')
      elabRunArgList.push('-elaborate')
      elabRunArgList.push('-access +rwc')
      elabRunArgList.push('-notimingchecks')
      elabRunArgList.push('-nospecify')

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

        /*
      let scNCBuildLibsParaList = _.map(scNCBuildLibs, (n) => {return `-loadsc ${n}`})
      elabRunArgList.push(...scNCBuildLibsParaList)
         */

      let elabRunargsFile = Path.resolve(iusElabBuildDir + '/irun_elab.args')
      fs.writeFileSync(elabRunargsFile, elabRunArgList.join("\n"), 'utf8')

      return {
        cmd: 'irun',
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

      var targetLinkDir

      let simINCALibsDir  = toPath(iusSimBuildDir, 'INCA_libs')
      let elabINCALibsDir = Path.resolve(iusElabBuildDir+'/INCA_libs')
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

      let simRunArgList = ['-log_ncsim sim.log', '-64bit', '-R', '-q', '-run', '-unbuffered', '-stacksize 2048000', '-nontcglitch', '-notimingchecks', '-nospecify'];

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

      let simRunargsFile = Path.resolve(iusSimBuildDir + '/irun_sim.args')
      fs.writeFileSync(simRunargsFile, simRunArgList.join("\n"), 'utf8')

      return {
        cmd: 'irun',
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
