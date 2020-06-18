export interface VerifSimInterface{
  workDir        : string
  verifWorkDir     : string
  verifWorkName    : string
  simRunDir      : string
  simulatorInstallDir  : string
  rtlRootDir     : string
  vppRTLExportDir: string
  benchTopName   : string
  groupConfigFile: string
  caseConfigFile : string
  case           : string
  caseDir        : string
  testcaseSO     : string
  elabBuildDir   : string
  simBuildDir    : string

  scSuitDir       : string
  flistFiles      : any[]
  chipTargetFlistFile : string

  flist      : string
  asicDutFlists  : string[]
  fpgaDutFlists  : string[]
  asicTBFlists   : string[]
  fpgaTBFlists   : string[]
  asicChipFlistFiles : string[]
  fpgaChipFlistFiles : string[]

  pre  : boolean
  post : boolean
  SDF  : string
  asicNetlistFlists  : string[]

  handle         : {
    process:any
    started:number
    finished:number
    log: string
    watchList: any[]
    message: string
  }

  simulatorCmdArgs   :{
    vlogArgs : string,
    elabArgs : string,
    runArgs  : string
  }
  
  groupName   : string
  groupArgs   : string
  elabTcl     : string
  simTcl      : string
  dumpScript  : string
  isNotDumpWave : string
  simCoverage : boolean

  isRebuild : boolean
  quiet     : boolean
  purgeAll  : boolean

  simRunFieldPlaceDir : string
  elabRunFieldPlaceDir : string

  elabArgsFile :string
  runArgsFile :string
}
