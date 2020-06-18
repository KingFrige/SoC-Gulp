export interface FPGAImpInterface {
  workDir     : string
  fpgaWorkDir : string
  buildDir    : string
  impBuildDir : string

  topModule          : string
  board              : string
  vivadoImpConstrain : string
  edfNetlist         : string

  fpgaTechnology     : string
  fpgaPart           : string
  fpgaPackage        : string
  fpgaSpeedGrade     : string
  FPGAPart           : string

  runFPGAImp : boolean
  isRebuild  : boolean
}
