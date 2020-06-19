export {}
require('json5/lib/register')
const gulp = require('gulp')
const JSON5 = require('json5')
const fs = require('fs')
const del = require('rimraf')
const _ = require('lodash')
const log = require('fancy-log')
const Path = require('path')
const mkdirp = require('mkdirp')
const glob = require('glob')
const through = require('through2')
const Mustache = require('mustache')
const uuid = require('uuid/v1')
const newer = require('gulp-newer')

let {toPath,getFullPath} = require('sulp_utils')

function _elabArgs(){
}

function elabPlan(){
}

function _simArgs(){
}

function simPlan(){
}

module.exports.elabPlan = elabPlan()
module.exports.simPlan = simPlan()
