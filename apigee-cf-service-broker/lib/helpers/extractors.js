const path = require('path')

const { VERBS } = require(path.resolve('./lib/helpers/enums'))

const deriveProtocol = (params) => {
  const proto = params.protocol ? params.protocol.toString().trim().toLowerCase() : 'http'
  const ret = {}

  if (proto === 'http' || proto === 'https') {
    ret.protocol = proto
  } else if (params.protocol) {
    ret.error = params.protocol.toString()
  }
  return ret
}

const deriveAction = (params) => {
  const action = params.action ? params.action.toString() : ''

  const ret = {
    any: false,
    errors: []
  }

  VERBS.forEach((verb) => {
    ret[verb] = false
  })

  action.split(/[\s,]+/).forEach((value) => {
    const lower = value.toLowerCase()
    if (VERBS.indexOf(lower) >= 0) {
      ret.any = true
      ret[lower] = true
    } else if (value) {
      ret.errors.push(value)
    }
  })

  return ret
}

const derivePort = (params) => {
  const port = params.target_app_port ? params.target_app_port : 80

  return port
}

module.exports = {
  deriveProtocol,
  deriveAction,
  derivePort
}
