export interface ASICFileInterface {
  sulpRootDir     : string
  workDir         : string
  asicProjectDir  : string
  rtlRootDir      : string

  synDir          : string
  synScriptsDir   : string

  moduleDescription : string
  sdcTargetFile : string
  synFlist      : string
  synTargetFlistPath : string
  commonFlists  : string[]
  topModule  : string
  techLib    : any
  libName    : string
  memDBFlist : string
  ipDBFlist  : string
  libTclTargetFile : string

  synTool    : string
  isRebuild  : boolean
}
