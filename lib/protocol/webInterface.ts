export interface WebInterface {
  handle: any
  autoexit: number
  rlEnable() : any
  rlClose(name:string) : number
  forceExit() : boolean
  waitstart: number
}
