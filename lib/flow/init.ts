export {};
require('json5/lib/register');
const gulp = require('gulp');
const JSON5 = require('json5');
const fs = require('fs');
const del = require('rimraf');
const _ = require('lodash');
const log = require('fancy-log');
const Path = require('path');
const glob = require('glob')
const mkdirp = require('mkdirp');
const newer = require('gulp-newer')
const through = require('through2')
const Mustache = require('mustache')


let {toPath,getFullPath, runCmdDetached, runCmd, buildTarget, delBuildDirAndFile, templateFileGen} = require('sulp_utils')

import {InitInterface} from "../protocol/initInterface"

let flow:InitInterface

gulp.task('init:project', () => {
  return new Promise((resolve)=>{

    if(fs.existsSync(flow.projectPath)){
      console.log("\n NOTE: The project has exist! \n")
      process.exit()
    } else {
      mkdirp.sync(flow.projectPath)
    }

    const verifPath = toPath(flow.projectPath, 'verif')
    const verifWorkPath = toPath(verifPath, 'demo')
    mkdirp.sync(verifWorkPath)
    copyVerifTemplate(verifWorkPath)

    const rtlPath  = toPath(flow.projectPath, 'rtl')
    mkdirp.sync(rtlPath)

    const docsPath  = toPath(flow.projectPath, 'docs')
    mkdirp.sync(docsPath)

    const toolchainPath  = toPath(flow.projectPath, 'toolchain')
    mkdirp.sync(toolchainPath)

    const fpgaPath  = toPath(flow.projectPath, 'fpga')
    const fpgaWorkPath = toPath(fpgaPath, 'demo')
    const fpgaConfigPath = toPath(fpgaWorkPath, 'config')
    mkdirp.sync(fpgaConfigPath)

    const asicPath  = toPath(flow.projectPath, 'asic')
    const asicWorkPath = toPath(asicPath, 'demo')
    const asicConfigPath = toPath(asicWorkPath, 'config')
    mkdirp.sync(asicConfigPath)

    const signoffPath  = toPath(flow.projectPath, 'signoff')
    const signoffWorkPath = toPath(signoffPath, 'demo')
    const signoffConfigPath = toPath(signoffWorkPath, 'config')
    mkdirp.sync(signoffWorkPath)

    const configPath  = toPath(flow.projectPath, 'config')
    const configPrjPath  = toPath(configPath, 'proj_config')
    const configJsonPath  = toPath(configPath, 'json')
    mkdirp.sync(configPrjPath)
    mkdirp.sync(configJsonPath)

    const templateMap = [
      {
        src: toPath('demo/README.md'),
        target: toPath(flow.projectPath, 'README.md')
      },
      {
        src: toPath('demo/work.ts'),
        target: toPath(flow.projectPath, 'work.ts')
      },
      {
        src: toPath('demo/sourceme.csh_template'),
        target: toPath(flow.projectPath, 'sourceme.csh')
      },
      {
        src: toPath('demo/sourceme.bash_template'),
        target: toPath(flow.projectPath, 'sourceme.bash')
      },
      {
        src: toPath('demo/rtl/work.ts_template'),
        target: toPath(rtlPath, 'work.ts')
      },
      {
        src: toPath('demo/verif/demo/work.ts_template'),
        target: toPath(verifWorkPath, 'work.ts')
      },
      {
        src: toPath('demo/fpga/demo/work.ts_template'),
        target: toPath(fpgaWorkPath, 'work.ts')
      },
      {
        src: toPath('demo/config/proj_config/proj_module_config.csv'),
        target: toPath(configPrjPath, 'proj_module_config.csv')
      },
    ]
    genStartFiles(flow.projectName, flow.workName, templateMap)

    gitInitProject(flow.projectPath)

    resolve()
  })
})

function genStartFiles(projectName: string, workName: string, templateMap:any){
  const workTemplateVars = {
    projectName: projectName,
    workName   : workName
  }

  for (let t of templateMap) {
    templateFileGen(t.src, t.target, workTemplateVars)
  }
}

function gitInitProject(projectPath: string){
  return runCmd('git', ['init'], projectPath)
    .then(() => {
      return runCmd('git', ['add', '.'], projectPath)
    })
    .then(() => {
      return runCmd('git', ['commit', '-m', 'initial project'], projectPath)
    })
}

gulp.task('new:verif',()=>{
  return new Promise((resolve)=>{
    const verifWorkPath   = flow.workPath
    mkdirp.sync(verifWorkPath)

    const templateMap = [
      {
        src: toPath('demo/verif/demo/work.ts_template'),
        target: toPath(verifWorkPath, 'work.ts')
      },
    ]
    genStartFiles(flow.projectName, flow.workName, templateMap)

    copyVerifTemplate(flow.workPath)

    resolve()
  })
})

function copyVerifTemplate(workPath: string){
  const verifTemplateFiles = glob.sync(`${toPath("demo/verif/demo/**")}`)
  const copyFiles = _.filter(verifTemplateFiles, (i) => {
    if (i.match(/template/)){
      return 
    } else {
      return i
    }
  })
  gulp.src(copyFiles,{base: toPath('demo/verif/demo')})
    .pipe(gulp.dest(workPath))
}

gulp.task('new:fpga',()=>{
  return new Promise((resolve)=>{
    resolve()
  })
})

gulp.task('new:file',()=>{
  return new Promise((resolve)=>{
    resolve()
  })
})

gulp.task('new:mem',()=>{
  return new Promise((resolve)=>{
    resolve()
  })
})

gulp.task('new:signoff',()=>{
  return new Promise((resolve)=>{
    resolve()
  })
})


module.exports.init = function(program) {
  program.allowUnknownOption()
    .option('--workDir <args>', 'specify work.ts dir')
    .option('-p, --projectName <args>', 'specify project name, initial a project')
    .option('-w, --workName <args>', 'specify work name, initial a work')
};

module.exports.flowName='init'

module.exports.setEnv = function(e) {
  let env = e

  flow = <InitInterface>env.getFlow('init');
  flow.workDir = env.flow.global.workDir 

  const projectName = env.getOpt('init.projectName', null)
  if(projectName != null){
    flow.projectPath = getFullPath(flow.workDir, projectName)
  } else {
    flow.projectPath = getFullPath(flow.workDir, 'demo')
  }
  flow.projectName = Path.basename(flow.projectPath)

  const workName= env.getOpt('init.workName', null)
  if(workName != null){
    flow.workPath = getFullPath(flow.workDir, workName)
  } else {
    flow.workPath = getFullPath(flow.workDir, 'demo')
  }

  flow.workName = Path.basename(flow.workPath)
};
