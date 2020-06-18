require('ts-node/register')
require('json5/lib/register')
require('coffeescript/register')
const colors = require('colors')
const commander = require('commander')
const env = require('./env.ts')

env.setup()

const flowList = []
if (!env.resetFlow()) {
  const list = require('./lib/default_flow.json5')
  for(const i of list) {
    let profile = ''
    if(i.profile) {
      profile = require(i.flow) 
    }
    flowList.push({
      flow   : require(i.flow),
      profile: profile
    })
  }
}

for(const i of env.getOpt('global.useFlow', [])) {
  flowList.push({
    flow: i.flow,
    profile: i.profile
  })
}

const flowNames = []
for(const i of flowList) {
  const program = new commander.Command()
  const name = i.flow.flowName
  flowNames.push(name)
  i.flow.init(program)
  program.helpOption('--'+name+':help')
  program.parse(process.argv)
  env.setProgram(name, program)
  env.setProfile(name, i.profile)
  env.injectFlow(name)
}
console.log('-------------------------')
console.log("import flow [",flowNames.join(','),']')
console.log('-------------------------')

for(const i of flowList) {
  i.flow.setEnv(env)
}

if(env.getOpt('global.helpall')) {
  const colorList = ['red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white', 'gray', 'grey']
  const p = env.getProgram('global')
  p.outputHelp((txt) => {
    return txt
  })
  let cnt = 0
  for(const i of flowNames) {
    const p = env.getProgram(i)
    console.log("----------------------------------")
    console.log('flow',i,'help')
    console.log("----------------------------------")
    p.outputHelp((txt) => {
      return colors[colorList[cnt%9]](txt)
    })
    cnt += 1
  }
}
