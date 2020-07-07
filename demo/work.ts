const PROJROOT_PATH = __dirname

module.exports = {
  default: {
    packDB:{
      metaProtocolTemplateDir:  PROJROOT_PATH+"/config/template",
    },
    gitFile:{
    },
    vppFile:{
      rtlConfigFile:  PROJROOT_PATH+"/config/json/rtl_config.json5",
    },
    vppRun:{
      vppRTLExportDir:  PROJROOT_PATH+"/rtl_export",
    },
    global: {
      projectDir : PROJROOT_PATH,
      // projectPathStr : "$PROJROOT_PATH",  // use variable, default use Absolute path
      rtlRootDir : PROJROOT_PATH+"/rtl",

      overwrite: true,
      useFlow: [
        {flow:require('flow/hello.ts')},
        {flow:require('flow/init.ts')},
        {flow:require('flow/git_file.ts')},
        {flow:require('flow/git_helper.ts')},
        {flow:require('flow/vpp_file.ts')},
        {flow:require('flow/vpp_module.ts')},
        {flow:require('flow/vpp_run.ts')},
        {flow:require('flow/mem_file.ts')},
        {flow:require('flow/design_dummy.ts')},
      ],
    }
  },
}
