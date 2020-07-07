const PROJROOT_PATH = __dirname+'/../'

module.exports = {
  default: {
    regression: {
      elabBuildDir:PROJROOT_PATH+"/verif/build",
      // simBuildDir:PROJROOT_PATH+"/verif/build",
      caseBuildDir:PROJROOT_PATH+"/verif/build"
    },
    vppFile:{
      rtlConfigFile:  PROJROOT_PATH+"/config/json/rtl_config.json5",
    },
    vppRun:{
      vppRTLExportDir:  PROJROOT_PATH+"/rtl_export",
    },
    global: {
      overwrite: true,
      verifRootDir:PROJROOT_PATH+'/verif',
      projectDir:PROJROOT_PATH,

      //scSuitDir: VERIF_ENV_ROOT,
      benchTopName:'bench_top',

      useFlow: [
        {flow:require('flow/init.ts')},
        {flow:require('flow/verif_regression.ts')},
      ],
    }
  },
}
