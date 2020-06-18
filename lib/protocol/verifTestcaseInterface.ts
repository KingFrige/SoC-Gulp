export interface VerifTestcaseInterface{
  workDir     : string
  benchDir    : string
  verifWorkDir  : string
  verifWorkName : string
  benchTopName: string
  scSuitDir   : string
  scCompilerGcc  : string
  caseDir        : string
  caseBuildDir   : string
  case           : string
  caseTemplate   : string
  isRebuild      : boolean
  iusInstallDir  : string
  jsonIncDir     : string
  purgeAll       : boolean
  cpuSrcDir      : string
}
