export interface VerifWaveInterface {
  workDir             : string
  buildDir            : string
  chipTargetFlistFile : string
  benchTopName        : string
  waveLoadArgs        : string
  waveTool            : string
  loadWaveFile        : boolean
  isRebuild           : boolean
}
