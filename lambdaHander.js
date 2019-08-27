'use strict'

const AWSCouchWatch = require('.')
const { version } = require('./package.json')

function scanWith (watcher) {
  return watcher.scan().then(function (metrics) {

  }).catch(function (error) {
    console.log('Error encountered:')
    console.trace(error)
  })
}

const { SCAN_DB, COUCH_URL } = process.env

module.exports.default = (event, context, callback) => {
  const watcher = new AWSCouchWatch({ url: COUCH_URL, scanDb: SCAN_DB })
  let metrics
  watcher.setup().then(() => {
    console.log('Scanning')
    return watcher.scan()
  })
  .then(_metrics => {
    metrics = _metrics
    console.log('%i metrics received.', metrics.length)
    return watcher.upload(metrics)  
  })
  .then(() => callback(null, metrics))
  .catch(err => {
     console.log('Scan error', err)
     callback(err)
  })
}
