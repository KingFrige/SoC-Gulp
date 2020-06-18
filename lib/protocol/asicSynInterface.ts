export interface ASICSynInterface {
  sulpRootDir     : string
  workDir         : string
  asicProjectDir  : string
  rtlRootDir      : string

  synDir          : string
  synLogDir       : string
  synRunDir       : string
  synOutputDir    : string
  synRptputDir    : string

  runASICSyn      : boolean

  sdcTargetFile : string
  synFlist      : string
  synTargetFlistPath : string
  commonFlist   : string
  topModule  : string

  isRebuild  : boolean
  synTool    : string
}
