require('json5/lib/register')
const gulp     = require('gulp')
const fs       = require('fs')
const _        = require('lodash')
const log      = require('fancy-log')
const jayson = require('jayson')
const ip = require('ip')
import {WebInterface} from "../protocol/webInterface"

let flow:WebInterface
let portNum=null
let data_handle=null
let stdout_message=''
let app=null
let web_exit=false
let log_file=null

const watchMessage = function(data) {
  return stdout_message += data.toString();
};

const process_status = function(handle) {
  return {
    running: handle.process != null,
    started: handle.started,
    finished: handle.finished
  };
};

const process_msg = function(handle) {
  if (handle.started === 0) {
    if (handle.process != null) {
      return '[process status] ' + 'find active process before started';
    } else {
      return '[process status] ' + 'process not start yet';
    }
  } else if (handle.finished === handle.started) {
    if (handle.process != null) {
      return '[process status] ' + 'process should be finished, but find active process';
    } else {
      return '[process status] ' + 'process is finished';
    }
  } else if (handle.finished < handle.started) {
    if (handle.process != null) {
      return '[process status] ' + 'process is running';
    } else {
      return '[process status] ' + 'process should be running, but not find active process';
    }
  } else {
    return '[process status] ' + 'process is unknown';
  }
};

const doCmd = function(args, callback) {
  var ref;
  if (((ref = flow.handle) != null ? ref.process : void 0) != null) {
    flow.handle.process.stdin.write(`${args.cmd}\n`);
    return callback(null, {
      status: true,
      message: ''
    });
  } else {
    return callback(null, {
      status: false,
      message: ''
    });
  }
};

const doSigInt = function(args, callback) {
  var ref;
  if (((ref = flow.handle) != null ? ref.process : void 0) != null) {
    flow.handle.process.kill('SIGINT');
    return callback(null, {
      status: true,
      message: ''
    });
  } else {
    return callback(null, {
      status: false,
      message: ''
    });
  }
};

const doStart = function(args, callback) {
  var cnt, handler, text;
  if (flow.handle.finished > 0) {
    if ((flow.handle.log != null) && fs.existsSync(flow.handle.log)) {
      text = fs.readFileSync(flow.handle.log, 'utf8');
      return callback(null, {
        status: false,
        message: text,
        info: process_status(flow.handle)
      });
    } else {
      return callback(null, {
        status: false,
        message: flow.handle.message + '\n' + process_msg(flow.handle),
        info: process_status(flow.handle)
      });
    }
  } else {
    cnt = 0;
    return handler = setInterval((() => {
      var ref;
      if (((ref = flow.handle) != null ? ref.process : void 0) != null) {
        if (data_handle === null) {
          stdout_message = flow.handle.message;
          data_handle = flow.handle.process.stdout.on('data', watchMessage);
        }
        callback(null, {
          status: true,
          message: '',
          info: process_status(flow.handle)
        });
        clearInterval(handler);
      }
      cnt += 1;
      if (cnt > 10) {
        clearInterval(handler);
        return callback(null, {
          status: false,
          message: process_msg(flow.handle),
          info: process_status(flow.handle)
        });
      }
    }), 1000);
  }
};

const doStop = function(args, callback) {
  if (data_handle != null) {
    if (flow.handle.process != null) {
      flow.handle.process.stdout.removeListener('data', watchMessage);
      callback(null, {
        status: true,
        message: ''
      });
    } else {
      callback(null, {
        status: false,
        message: 'process not found'
      });
    }
    return data_handle = null;
  } else {
    return callback(null, {
      status: false,
      message: 'has been disconnected'
    });
  }
};

const doQuery = function(args, callback) {
  var msg, ref;
  if (((ref = flow.handle) != null ? ref.process : void 0) != null) {
    callback(null, {
      status: true,
      message: stdout_message,
      info: process_status(flow.handle)
    });
    return stdout_message = '';
  } else {
    msg = stdout_message + '\n' + process_msg(flow.handle);
    callback(null, {
      status: false,
      message: msg,
      info: process_status(flow.handle)
    });
    return stdout_message = '';
  }
};

gulp.task('web', () => {
  return new Promise(function(resolve) {
    var e, ipAddr, rl, server;
    rl = flow.rlEnable();
    rl.on('line', (line) => {
      var m;
      m = line.match(/^web\s+(.*)/);
      if (m != null) {
        if (m[1] === 'port') {
          return console.log(portNum);
        } else if (m[1] === 'exit') {
          return web_exit = true;
        }
      }
    });
    if (flow.autoexit > 0) {
      setInterval((() => {
        if (flow.handle.finished === flow.autoexit) {
          return setTimeout((() => {
            return web_exit = true;
          }), flow.waitstart * 1000);
        }
      }), 1000);
    }
    setInterval((() => {
      var ref;
      if (web_exit) {
        flow.rlClose('web shell');
        resolve();
        if (((ref = flow.handle) != null ? ref.process : void 0) != null) {
          flow.handle.process.kill();
        }
        return setTimeout((() => {
          app.close();
          return flow.forceExit();
        }));
      }
    }), 1000);
    server = jayson.server({
      start: doStart,
      stop: doStop,
      query: doQuery,
      sigint: doSigInt,
      send: doCmd,
      exit: function(args, callback) {
        var msg;
        if (flow.handle.process != null) {
          flow.handle.process.stdout.removeListener('data', watchMessage);
        }
        web_exit = true;
        msg = stdout_message + '\n' + process_msg(flow.handle);
        callback(null, {
          status: true,
          message: msg
        });
        return stdout_message = '';
      }
    });
    ipAddr = ip.address();
    console.log('==========================================');
    console.log(`RPC Server ip ${ipAddr}/127.0.0.1 port ${portNum}`);
    console.log('==========================================');
    try {
      app = server.http().listen(portNum, ipAddr);
    } catch (error) {
      e = error;
      console.log('listen ip failed', e);
    }
    if (ipAddr !== '127.0.0.1') {
      try {
        return app = server.http().listen(portNum, '127.0.0.1');
      } catch (error) {
        e = error;
        return console.log('listen 127.0.0.1 failed', e);
      }
    }
  });
});

module.exports.init = function(program) {
  program.allowUnknownOption()
    .option('--port <port number>', 'specify port number', 5555)
    .option('--autoexit <count number>', 'auto exit web flow when job number finished', 0)
    .option('--waitstart <timeout value>', 'wait client connect after job finished', 0)
};

module.exports.flowName='web'

module.exports.setEnv = function(env) {
  portNum = Number(env.getOpt('web.port'));
  flow = <WebInterface>env.getFlow('web');
  flow.handle = env.flow.sim.handle;
  flow.autoexit = Number(env.getOpt('web.autoexit'));
  flow.rlEnable = env.rlEnable;
  flow.rlClose = env.rlClose;
  flow.forceExit = env.forceExit;
  flow.waitstart = Number(env.getOpt('web.waitstart'));
  env.watchExit()
};
