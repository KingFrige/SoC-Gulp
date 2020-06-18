export interface VerifRegressionInterface {
  verifRootDir  : string
  workDir       : string
  runAll        : boolean
  runRegression : string
  elabBuildDir  : string
  simBuildDir   : string
  caseBuildDir  : string
  isDumpWave    : boolean
  nostdout      : boolean

  reportType    : string
  regressionType: string
  techType      : string
  reportOutputDir : string
}
