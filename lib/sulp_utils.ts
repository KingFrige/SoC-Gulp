export {}
const spawn = require('child_process').spawn
const Path = require('path')
const fs = require('fs')
const del = require('rimraf')
const mkdirp = require('mkdirp')
const log = require('fancy-log')
const _ = require('lodash')
const Mustache = require('mustache')

const compact = function(list) {
  return _.filter(list, function(i) {
    if (i === null || i === '' || i === void 0) {
      return false
    } else {
      return true
    }
  })
}

const cmdWirtToFile = (cmd, args, cwd) => {
  const cmdRunFileDir = process.env.CMD_RUN_FILE_PATH
  let exeDir = cmdRunFileDir
  if(cwd != null){
    exeDir = cwd
  }

  let runCmdList = []
  runCmdList.push(cmd)
  runCmdList.push(...args)
  let runCmdStr = runCmdList.join(' ')

  let timestamp = new Date()
  const runCmdLogFile = Path.resolve(cmdRunFileDir+'/runCmdLogFile.log')
  fs.appendFileSync(runCmdLogFile, timestamp, 'utf8')
  fs.appendFileSync(runCmdLogFile, "\n", 'utf8')
  fs.appendFileSync(runCmdLogFile, exeDir, 'utf8')
  fs.appendFileSync(runCmdLogFile, "\n", 'utf8')
  fs.appendFileSync(runCmdLogFile, runCmdStr, 'utf8')
  fs.appendFileSync(runCmdLogFile, "\n\n\n", 'utf8')
}

const exportObj = {
  toPath: function(...list) {
    return Path.resolve(list.join('/'))
  },
  getFullPath: function(basePath, path) {
    if (path == null) {
      throw new Error('path is null')
    }
    if (path.match(/^\//)) {
      return path
    } else {
      return Path.resolve(basePath + '/' + path)
    }
  },
  compileIssueFac: function(cpus, func) {
    var cnt
    cnt = 0
    return function(src, dst) {
      return new Promise(function(resolve) {
        var intervalHandle
        if (cnt < cpus) {
          cnt += 1
          return func(src, dst).then(() => {
            cnt -= 1
            return resolve()
          })
        } else {
          return intervalHandle = setInterval((() => {
            if (cnt < cpus) {
              cnt += 1
              func(src, dst).then(() => {
                cnt -= 1
                return resolve()
              })
              return clearInterval(intervalHandle)
            }
          }), 200)
        }
      })
    }
  },
  runCmdDetached: function(cmd, args, cwd = null, bin = null, quiet = false) {
    log(cmd, compact(args))
    return new Promise(function(resolve, reject) {
      var childProcess, tail
      childProcess = spawn(cmd, compact(args), {
        detached: true,
        cwd: cwd,
        stdio: ["pipe", 'pipe', 2]
      })
      if (bin != null) {
        bin.process = childProcess
        bin.started += 1
        bin.watchList.push(childProcess)
      }
      childProcess.stdout.on('data', function(data) {
        if (bin != null) {
          return bin.message += data
        }
      })
      if (quiet === false) {
        tail = ''
        childProcess.stdout.on('data', function(data) {
          var index, str
          str = tail + data.toString()
          index = _.findLastIndex(str, function(i) {
            return i === '\n'
          })
          if (index > 0) {
            console.log(str.substr(0, index + 1))
            return tail = str.substr(index + 1)
          } else {
            return tail = str
          }
        })
      }
      return childProcess.on('exit', function(code) {
        if (bin != null) {
          bin.process = null
          bin.finished += 1
        }
        if (code === 0) {
          return resolve(childProcess)
        } else {
          return reject(childProcess)
        }
      })
    })
  },
  runCmd: function(cmd, args, cwd = null) {
    // log(cmd, compact(args))
    cmdWirtToFile(cmd, args, cwd)

    return new Promise(function(resolve, reject) {
      var childProcess
      childProcess = spawn(cmd, compact(args), {
        cwd: cwd,
        stdio: [0, 1, 2]
      })
      return childProcess.on('exit', function(code) {
        if (code === 0) {
          return resolve(childProcess)
        } else {
          return reject(childProcess)
        }
      })
    })
  },
  buildTarget: (cmd, args, target) => {
    var buildDir
    buildDir = Path.dirname(target)
    if (fs.existsSync(target)) {
      del.sync(target)
    }
    if (!fs.existsSync(buildDir)) {
      mkdirp.sync(buildDir)
    }
    return exportObj.runCmd(cmd, args, buildDir).then((result:any) => {
      var stderr, stdout
      stdout = result.stdout
      stderr = result.stderr
      if (!fs.existsSync(target)) {
        log('[Command]', cmd)
        log('[Target]', target)
        log('[Return]', stderr)
        //log '[Return]',stdout,stderr
        return new Promise(function(resolve, reject) {
          return reject()
        })
      } else {
        //log '[Command]',cmd,stdout
        log("[Build Pass]=>", target)
        return new Promise(function(resolve, reject) {
          return resolve()
        })
      }
    })
  },
  delBuildDirAndFile: (buildDir:string) => {
    if(fs.existsSync(buildDir)){ 
      del.sync(buildDir)
      console.log('remove', buildDir)
    } else {
      // console.log(buildDir, "is EMPTY.")
      // console.log("No deletion required.")
    }
  },
  templateFileGen: (src, target, templateVars) => {
    var output, text
    text = fs.readFileSync(src, 'utf8')
    if (src.match(/.template$/)) {
      output = Mustache.render(text, templateVars)
      fs.writeFileSync(target, output, 'utf8')
    } else {
      fs.writeFileSync(target, text, 'utf8')
    }
    return log('generate file', target)
  }
}

module.exports = exportObj
