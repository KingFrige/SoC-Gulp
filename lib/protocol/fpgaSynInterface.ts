export interface FPGASynInterface {
  workDir     : string
  fpgaWorkDir : string
  buildDir    : string

  synSynplifyBuildDir : string
  synVivadoBuildDir   : string

  synplifySynFl      : string
  vivadoSynFl        : string
  topModule          : string
  board              : string
  syplifySynConstrain: string
  vivadoSynConstrain : string
  ipVivadoTcls       : string
  edfNetlist         : string

  fpgaTechnology     : string
  fpgaPart           : string
  fpgaPackage        : string
  fpgaSpeedGrade     : string
  FPGAPart           : string

  runFPGASyn : boolean
  isRebuild  : boolean
}
