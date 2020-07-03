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


let {toPath,getFullPath, runCmdDetached, runCmd, templateFileGen} = require('sulp_utils')

import {ASICFileInterface} from "../protocol/asicFileInterface"

let flow:ASICFileInterface

function  getFlist(mypathList){
  let linesText = ''
  for (let pathLine of mypathList) {
    let dirname = Path.dirname(Path.resolve(pathLine))
    let lines = fs.readFileSync(pathLine, 'utf8').split(/\n/)
    for (let line of lines) {
      if (line.trim() !== '') {
        if (line.match(/^[a-zA-Z_]/) || line.match(/^\./)) {
          let tmpLine = line.replace(/^/, dirname + '/')
          linesText += tmpLine.replace( /\/\.\//,  '/') + '\n'
        } else if(line.match(/^-v\s+[a-zA-Z]/) || line.match(/^-v\s+\./)) {
          let tmpLine = line.replace(/^-v\s+/, '-v ' + dirname + '/')
          linesText += tmpLine.replace( /\/\.\//,  '/') + '\n'
        } else if(line.match(/^-f\s+[a-zA-Z]/) || line.match(/^-f\s+\./)) {
          let tmpLine = line.replace(/^-f\s+/, '-f ' + dirname + '/')
          linesText += tmpLine.replace( /\/\.\//,  '/') + '\n'
        } else if(line.match(/^-F\s+[a-zA-Z]/) || line.match(/^-F\s+\./)) {
          let rtlIncDir = Path.dirname(line.split(/\s+/)[1])
          if(rtlIncDir.match(/^[a-zA-Z_]/) || rtlIncDir.match(/^\./)){
            rtlIncDir = toPath(dirname, rtlIncDir)
          }
          linesText += '+incdir+'+rtlIncDir+ '\n'
          let tmpLine = line.replace(/^-F\s+/, '-f ' + dirname + '/')
          linesText += tmpLine.replace( /\/\.\//,  '/') + '\n'
        } else if(line.match(/^\+incdir\+\./)) {
          let tmpLine = line.replace(/^\+incdir\+/, '+incdir+' + dirname + '/')
          linesText += tmpLine.replace( /\/\.\//,  '/') + '\n'
        } else {
          linesText += line.replace(/\/\.\//, '/') + '\n'; // remove (./)
        }
      }
    }
  }
  return linesText
}

function mergeFlist(moduleInfo:string, synTargetFlistPath:string){
  const moduleInfoObj = require(moduleInfo)
  const flistConfigList = moduleInfoObj.flist

  const asicSynRTLFlist = []
  for(let item of flistConfigList){
    for(let flist of item.flist){
      let flistPath = Path.resolve(flow.workDir + '/' + flist.path)
      asicSynRTLFlist.push(flistPath)
      // console.log("Path = ", flistPath)
    }
  }

  if(flow.commonFlists){
    asicSynRTLFlist.push(...flow.commonFlists)
  }

  if(asicSynRTLFlist.length != 0){
    let asicSynRTLFlistLines = getFlist(asicSynRTLFlist)
    fs.writeFileSync(synTargetFlistPath, asicSynRTLFlistLines, 'utf8')
  }
}

gulp.task('merge:asicFl',()=>{

  if(!fs.existsSync(flow.synDir)){
    mkdirp.sync(flow.synDir)
  }

  mergeFlist(flow.moduleInfo, flow.synTargetFlistPath)

  return new Promise((resolve)=>{
    resolve()
  })
})


function genSDCTemplate(moduleInfo:string, sdcTargetFile:string){
  const moduleInfoObj = require(moduleInfo)
  const portConfigList = moduleInfoObj.port
  const sdcText = []

  sdcText.push('#####################')
  sdcText.push('# timing')
  sdcText.push('#####################')

  let clockList = []
  let resetList = []
  sdcText.push('set MAX_FANOUT  20')
  sdcText.push('set MAX_TRANS   0.3')
  sdcText.push('set MAX_CAP     0.2')
  sdcText.push('set OUTPUT_LOAD 0.1')
  sdcText.push("")

  for(let index in portConfigList){
    let item = portConfigList[index]

    clockList.push(item.clock)
    sdcText.push('set CLK'+index+'_PERIOD '+(1000/item.freqMHz))
    sdcText.push('set CLK'+index+'_HALF        [expr 0.50 * $CLK'+index+'_PERIOD]')
    sdcText.push('set CLK'+index+'_ONETHIRD    [expr 0.33 * $CLK'+index+'_PERIOD]')
    sdcText.push('set CLK'+index+'_TWOTHIRD    [expr 0.67 * $CLK'+index+'_PERIOD]')
    sdcText.push('set CLK'+index+'_TENTH       [expr 0.10 * $CLK'+index+'_PERIOD]')
    sdcText.push("")

    sdcText.push('# create clock '+item.clock)
    sdcText.push('create_clock -name CLK'+index+' [get_ports '+item.clock+'] -period $CLK'+index+'_PERIOD -waveform "0 $CLK'+index+'_HALF"')
    sdcText.push('set_dont_touch_network [get_ports '+item.clock+']')
    sdcText.push("")

    if(item.reset){
      sdcText.push('set clk'+index+'_reset {'+item.reset+'}')
      sdcText.push('set_dont_touch_network [get_ports '+item.reset+']')
      sdcText.push('set_input_delay  -min $CLK'+index+'_TENTH    -clock CLK'+index+' $clk'+index+'_reset')
      sdcText.push('set_input_delay  -max $CLK'+index+'_ONETHIRD -clock CLK'+index+' $clk'+index+'_reset -add_delay')
      sdcText.push('set_max_capacitance $MAX_CAP    [get_ports $clk'+index+'_reset]')
      sdcText.push("")
    }

    if(item.input){
      sdcText.push('set clk'+index+'_input {'+item.input.split(/,/).join(' ')+'}')
      sdcText.push('set_input_delay  -min $CLK'+index+'_TENTH    -clock CLK'+index+' $clk'+index+'_input -add_delay')
      sdcText.push('set_input_delay  -max $CLK'+index+'_ONETHIRD -clock CLK'+index+' $clk'+index+'_input -add_delay')
      sdcText.push('set_max_capacitance $MAX_CAP    [get_ports $clk'+index+'_input]')
      sdcText.push("")
    }

    if(item.output){
      sdcText.push('set clk'+index+'_output {'+item.output.split(/,/).join(' ')+'}')
      sdcText.push('set_output_delay -min -0.05          -clock CLK'+index+' $clk'+index+'_output -add_delay')
      sdcText.push('set_output_delay -max $CLK'+index+'_ONETHIRD -clock CLK'+index+' $clk'+index+'_output -add_delay')
      sdcText.push('set_max_capacitance $MAX_CAP    [get_ports $clk'+index+'_output]')
    }
    sdcText.push("")
  }

  sdcText.push('#clock uncertainty')
  sdcText.push('set_clock_uncertainty 0.200 -setup [all_clocks]')
  sdcText.push('set_clock_uncertainty 0.0 -hold  [all_clocks]')
  sdcText.push("")

  sdcText.push('# Load/Drive and DRC rules')
  sdcText.push('set_load -pin_load 10 [all_output]')
  sdcText.push('set_drive 0 [all_input]')
  sdcText.push("")

  sdcText.push('# Define design environments:')
  sdcText.push('set_max_fanout      $MAX_FANOUT [current_design]')
  sdcText.push('set_max_transition  $MAX_TRANS  [current_design]')
  sdcText.push('set_max_capacitance $MAX_CAP    [current_design]')
  sdcText.push("")

  if(clockList.length > 1){
    sdcText.push('# Clock groups')
    for(let index in clockList){
      if(Number(index) == 0){
        sdcText.push('set_clock_groups -asynchronous -name grp1 -group [get_clocks {CLK'+index+'}] \\')
      } else if(Number(index) == (clockList.length-1)){
        sdcText.push('                                          -group [get_clocks {CLK'+index+'}]')
        sdcText.push("")
      } else {
        sdcText.push('                                          -group [get_clocks {CLK'+index+'}] \\')
      }
    }
  }

  sdcText.push('#####################')
  sdcText.push('# area')
  sdcText.push('#####################')
  sdcText.push('set_max_area 0')
  sdcText.push("")

  sdcText.push('#####################')
  sdcText.push('# report group')
  sdcText.push('#####################')
  sdcText.push('group_path -name reg2reg -weight 10 -critical_range 0.5 -from [all_registers] -to [all_registers]')
  sdcText.push('group_path -name reg2out -weight 2  -critical_range 0.5 -to   [all_outputs]')
  sdcText.push('group_path -name in2reg  -weight 2  -critical_range 0.5 -from [all_inputs]')
  sdcText.push('group_path -name in2out  -weight 1  -critical_range 0.5 -from [all_inputs]    -to [all_outputs]')
  
  fs.writeFileSync(sdcTargetFile, sdcText.join('\n'), 'utf8')
}

gulp.task('gen:asicSDC',()=>{

  if(!fs.existsSync(flow.synScriptsDir)){
    mkdirp.sync(flow.synScriptsDir)
  }

  if(Path.basename(flow.sdcTargetFile) == 'design.sdc' && fs.existsSync(flow.moduleInfo)){
    genSDCTemplate(flow.moduleInfo, flow.sdcTargetFile)
  }

  return new Promise((resolve)=>{
    resolve()
  })
})

function genLibTclTemplate(libTclTargetFile:string, techLib:any, techLibName, memDBFlist, ipDBFlist){
  const libTclText = []

  libTclText.push('#######PrimeTime Variable Setting ###############')
  libTclText.push('set sh_enable_page_mode true')
  libTclText.push('set svr_keep_unconnected_nets true')
  libTclText.push('set timing_non_unate_clock_compatibility true')
  libTclText.push('set timing_remove_clock_reconvergence_pessimism true')
  libTclText.push('set timing_report_unconstrained_paths true')
  libTclText.push('set si_enable_analysis true')
  libTclText.push('set si_xtalk_delay_analysis_mode all_violating_paths')
  libTclText.push('set si_xtalk_exit_on_max_iteration_count 2')
  libTclText.push('')
  libTclText.push('set power_enable_analysis true')
  libTclText.push('')
  libTclText.push('set auto_wire_load_selection true')
  libTclText.push('')
  libTclText.push('#######Library Variable Setting ###############')

  const targetLib = []
  for(let lib of techLib){
    if(lib.name == techLibName){
      targetLib.push(...lib.db)
      // console.log(targetLib)
    }
  }
  if(targetLib.length == 0){
    console.log('')
    console.log("ERROR: please specify tech lib, libName is error OR the lib does not exist!")
    console.log('')
    process.exit()
  }

  libTclText.push('set targetLib "'+targetLib.join(" ")+'"')
  libTclText.push('')

  libTclText.push('set mem_library ""')
  if(memDBFlist){
    libTclText.push('set memDBList []')
    libTclText.push('set memDBFlist '+memDBFlist)
    libTclText.push('set memDBList [open $memDBFlist]')
    libTclText.push('while {[gets $memDBList line] >= 1} {')
    libTclText.push('   lappend mem_library $line')
    libTclText.push('}')
    libTclText.push('')
  }
  // console.log(">>> ", memDBFlist)

  libTclText.push('set ip_library ""')
  if(ipDBFlist){
    libTclText.push('set ipDBList []')
    libTclText.push('set ipDBFlist '+ipDBFlist)
    libTclText.push('set ipDBList [open $ipDBFlist]')
    libTclText.push('while {[gets $ipDBList line] >= 1} {')
    libTclText.push('   lappend ip_library $line')
    libTclText.push('}')
    libTclText.push('')
  }
  // console.log(">>> ", ipDBFlist)

  libTclText.push('')
  libTclText.push('set search_path  [list $search_path]')
  libTclText.push('set target_library $targetLib')
  libTclText.push('set link_library "* $target_library $synthetic_library $mem_library $ip_library"')

  fs.writeFileSync(libTclTargetFile, libTclText.join('\n'), 'utf8')
  console.log("============================")
  console.log("gen libTclTargetFile: ")
  console.log(libTclTargetFile)
  console.log("============================")
}
gulp.task('gen:libTcl',()=>{
  if(!fs.existsSync(flow.synScriptsDir)){
    mkdirp.sync(flow.synScriptsDir)
  }
  
  if(Path.basename(flow.libTclTargetFile) == 'lib_setup.tcl' && fs.existsSync(flow.moduleInfo)){
    genLibTclTemplate(flow.libTclTargetFile, flow.techLib, flow.libName, flow.memDBFlist, flow.ipDBFlist)
  }
  
  return new Promise((resolve)=>{
    resolve()
  })
})


gulp.task('gen:synTcl',()=>{
  const moduleInfoObj = require(flow.moduleInfo)
  const topModule = moduleInfoObj.topModule

  if(!fs.existsSync(flow.synScriptsDir)){
    mkdirp.sync(flow.synScriptsDir)
  }

  const templateMap = [
    {
      src: toPath(flow.sulpRootDir, 'template/asic/scripts/dc_syn.tcl.template'),
      target: toPath(flow.synScriptsDir, 'dc_syn.tcl')
    },
    {
      src: toPath(flow.sulpRootDir, 'template/asic/scripts/report.tcl.template'),
      target: toPath(flow.synScriptsDir, 'report.tcl')
    }
  ]

  const templateVars = {
    topModule   : topModule
  }

  for (let t of templateMap) {
    templateFileGen(t.src, t.target, templateVars)
  }

  return new Promise((resolve)=>{
    resolve()
  })
})

gulp.task('gen:asicUPF',()=>{
  return new Promise((resolve)=>{
    resolve()
  })
})

module.exports.init = function(program) {
  program.allowUnknownOption()
    .option('--force', 'rebuild asic file flow')
    .option('-f, --flist <args>', 'specify dut flist')
    .option('-T, --topModule <args>', 'specify dut topModule')
    .option('--moduleInfo <args>', 'specify ip description json5 file')
    .option('--commonFlist <args>', 'specify ip commonFlist')
    .option('--libName <args>', 'specify tech lib name, default ssDB')
}

module.exports.flowName='asicFile'

module.exports.setEnv = function(e) {
  let env = e

  flow = <ASICFileInterface>env.getFlow('asicFile')
  flow.sulpRootDir = process.env.SULP_ROOT
  flow.workDir  = env.flow.global.workDir

  flow.synDir = env.getOpt('asicFile.synDir', toPath(flow.workDir, 'build/syn'))
  flow.synScriptsDir = toPath(flow.synDir, 'scripts')

  flow.moduleInfo = env.getOpt('asicFile.moduleInfo', toPath(flow.workDir, 'module_info.json5'))

  flow.sdcTargetFile = env.getOpt('asicFile.sdcTargetFile', toPath(flow.synScriptsDir, 'design.sdc'))
  flow.commonFlists = env.getOpt('asicFile.commonFlists', null)

  flow.synFlist  = env.getOpt('asicFile.synFlist', toPath(flow.workDir, 'flist.f'))
  flow.synTargetFlistPath = env.getOpt('asicFile.synTargetFlistPath', toPath(flow.synDir, 'synFlist.f'))
  flow.techLib = env.getOpt('asicFile.techLib', null)
  flow.libName = env.getOpt('asicFile.libName', 'ssDB')
  flow.memDBFlist = env.getOpt('asicFile.memDBFlist', null)
  flow.ipDBFlist = env.getOpt('asicFile.ipDBFlist', null)
  flow.libTclTargetFile = env.getOpt('asicFile.libTclTargetFile', toPath(flow.synScriptsDir, 'lib_setup.tcl'))

  flow.isRebuild = env.getOpt('asicFile.force', env.getOpt('asicFile.isRebuild', false))
}
