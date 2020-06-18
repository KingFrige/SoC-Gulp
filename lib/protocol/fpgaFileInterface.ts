export interface FPGAFileInterface {
  workDir     : string
  fpgaWorkDir : string
  rtlRootDir  : string
  buildDir    : string

  flist       : string
  fpgaChipFlList         : any[]
  chipTargetRTLFlistFile : string

  synSynplifyBuildDir : string
  synVivadoBuildDir   : string
  synplifySynFl : string
  vivadoSynFl   : string

  isRebuild  : boolean
}
