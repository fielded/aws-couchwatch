'use strict'

const AWSCouchWatch = require('.')
const { version } = require('./package.json')

const { SCAN_DB, COUCH_URL } = process.env

let decrypted
const decrypt = () => {
  if (decrypted) {
     return decrypted 
  }
  
  console.log('Decrypting credentials')
  // Decrypt code should run once and variables stored outside of the function
  // handler so that these are decrypted once per container
  const kms = new AWS.KMS()
  decrypted = kms.decrypt({
    CiphertextBlob: Buffer.from(COUCH_URL, 'base64')
  })
    .promise()
    .then(data => {
      const decryptedPassword = data.Plaintext.toString('ascii')
      console.log('Successful decryption ***** ')
      return decryptedPassword
    })
    .catch(e => {
      console.log('Decryption error', e)
      decrypted = null
      throw e
    })
}

module.exports.default = (event, context, callback) => {
  let watcher
  let metrics
  return decrypt()
    .then(decryptedURL => { 
      watcher = new AWSCouchWatch({ url: decryptedUrl, scanDb: SCAN_DB })
      return watcher.setup()
    })
    .then(() => {
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
