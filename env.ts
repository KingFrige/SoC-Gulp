require('json5/lib/register')
require('coffeescript/register')
const readline = require('readline')
const JSON5    = require('json5')
const fs       = require('fs')
const del      = require('rimraf')
const _        = require('lodash')
const log      = require('fancy-log')
const glob     = require('glob')
const Path     = require('path')
const uuid     = require('uuid/v1')
const mkdirp   = require('mkdirp')
const commander = require('commander')
import {FlowGlobal} from './envInterface'

let WorkConfig = {}

const findWorkJson = (pList) => {
  let workJsonPath
  if (fs.existsSync('/' + pList.join('/') + '/work.json5')) {
    workJsonPath = '/' + pList.join('/') + '/work.json5'
  } else if (fs.existsSync('/' + pList.join('/') + '/work.json')) {
    workJsonPath = '/' + pList.join('/') + '/work.json'
  } else if (fs.existsSync('/' + pList.join('/') + '/work.ts')) {
    workJsonPath = '/' + pList.join('/') + '/work.ts'
  } else if (fs.existsSync('/' + pList.join('/') + '/work.coffee')) {
    workJsonPath = '/' + pList.join('/') + '/work.coffee'
  } else {
    if (pList.length > 1) {
      return findWorkJson(pList.slice(0, -1)) // recuisive lookup
    } else {
      return null
    }
  }

  return workJsonPath.replace(/\/\//,'/')
}

const loadWork = (path,workName) =>{
  const obj= require(path)
  if (obj[workName] != null) {
    return obj[workName]
  } else {
    return {}
  }
}

const defaultOptions={
  gcc: '/usr/bin/g++',
}

const flowConfig = {}
const profileMap = {}
const watchList  = []

const findInFlowConfig = (key) => {
  return _.get(flowConfig,key)
}

const getOpt = (key,defaultValue=null) => {
  if (_.get(Program, key) != null) {
    const result = _.get(Program, key)
    if(_.isFunction(result)){
      return defaultValue
    } else {
      return result
    }
  } else if (_.get(WorkConfig, key) != null) {
    return _.get(WorkConfig, key)
  } else {
    const value = findInFlowConfig(key)
    if (value != null) {
      return value
    } else if (defaultOptions[key] != null) {
      return defaultOptions[key]
    } else {
      return defaultValue
    }
  }
}

module.exports.getOpt = getOpt

const mergeOpt = (key) => {
  let list = []
  let value
  if (_.get(Program, key) != null) {
    list.push(Program[key])
  }
  value = findInFlowConfig(key)
  if (value != null) {
    list.push(value)
  }
  value = _.get(WorkConfig,key)
  if (value != null) {
    list.push(value)
  }
  if (defaultOptions[key] != null) {
    list.push(defaultOptions[key])
  }

  return list.join(' ')
}

module.exports.mergeOpt = mergeOpt

module.exports.injectFlowConfig = (key,c) => {
  flowConfig[key] = c
}

module.exports.injectFlow = (key) => {
  if (WorkConfig[key] != null) {
    Flow[key] = WorkConfig[key]
  } else {
    Flow[key] = {}
  }
  return Flow[key]
}

module.exports.getFlow = (key) => {
  return Flow[key]
}

module.exports.useProfile = (key) => {
  return profileMap[key]
}

module.exports.setProfile = (key,value) => {
  profileMap[key] = value
}

let rlCnt:number = 0
let forceExit:boolean = false

process.on('SIGINT', () => {
  setTimeout(() => {
    if(!_.isNil(Flow.global.rl)) {
      Flow.global.rl.prompt()
    } else {
      forceExit = true
    }
  },100)
})

module.exports.rlEnable = ()=>{
  if (Flow.global.rl === null) {
    Flow.global.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
      prompt: "[sulp-shell]>>"
    })
    Flow.global.rl.on('line', (line) => {
      const m = line.match(/^sulp\s+(.*)/)
      if (m != null) {
        if (m[1] === 'exit') {
          forceExit = true
        }
      }
    })
  }
  rlCnt += 1
  return Flow.global.rl
}

module.exports.rlClose = (name) => {
  rlCnt -= 1
  console.log('====================')
  console.log(name, 'exit')
  console.log('====================')
  if (rlCnt === 0) {
    Flow.global.rl.close()
    Flow.global.rl = null
  }
  return rlCnt
}

module.exports.forceExit = () => {
  forceExit = true
}

let watchExitStarted = false
module.exports.watchExit = () => {
  if(watchExitStarted) {
    return
  }
  watchExitStarted = true
  setInterval((() => {
    if (forceExit) {
      let j, len
      for (j = 0, len = watchList.length; j < len; j++) {
        let i = watchList[j]
        if ((i != null) && (i.kill != null)) {
          i.kill()
        }
      }
      return process.exit()
    }
  }), 1000)
}

const globProgram = new commander.Command()
globProgram
  .allowUnknownOption()
  .option('--work <work name>', 'work name')
  .option('--overwrite', 'orverwrite default flow')
  .option('--workDir <work dir name>', 'work space directory')
  .option('--debug', 'print debug infomation')
  .option('--cpu <number>', 'compile use cpu number')
  .option('--helpall')
  .helpOption('--sulp:help')
  .parse(process.argv)

const Program = {
  global: globProgram,
}

const Flow = {
  global: <FlowGlobal> {
    rl: null,
    workDir: '',
  }
}

module.exports.resetFlow = ()=> {
  return getOpt('global.overwrite', false)
}

module.exports.setup = ()=> {
  let workDir
  if (Program.global.workDir != null) {
    if (Path.isAbsolute(Program.global.workDir)) {
      workDir = Path.resolve(Program.global.workDir)
    } else {
      workDir = Path.resolve(Path.join(process.env.PWD, Program.global.workDir))
    }
  } else {
    workDir = Path.resolve(process.env.PWD)
  }
  Flow.global.workDir = workDir

  process.env.CMD_RUN_FILE_PATH = workDir
  Flow.global.rl = null
  const workJsonFile = findWorkJson(workDir.split(/\//))
  if (fs.existsSync(workJsonFile)) {
    const workName = getOpt('global.work', 'default')
    WorkConfig= loadWork(workJsonFile, workName)
    console.log('================================')
    console.log('Load work configuration file', workJsonFile)
    console.log('Configuration name', workName)
    //console.log(JSON5.stringify(WorkConfig, null, '  '))
    return console.log('================================')
  }
}

module.exports.flow = Flow

module.exports.setProgram = (key,value) => {
  Program[key]=value
}

module.exports.getProgram = (key) => {
  return Program[key]
}

module.exports.watchList = watchList
module.exports.findWorkJson = findWorkJson
