export interface VppFileInterface {
  projectDir    : string
  workDir       : string
  rtlRootDir    : string
  moduleDir     : string
  chipFlConfigFile   : string
  moduleFlConfigFile : string

  isRebuild : boolean
}
