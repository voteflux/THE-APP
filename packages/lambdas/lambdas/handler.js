'use strict';

/*
 * Flux Api V2
 *
 * DEVELOPER FYI:
 *
 * When firing the callback from a lambda function be aware that all handlers
 * are wrapped with `wrapHandler` - this will automatically run JSON.stringify
 * over the response.body object.
 *
 * Also, handlers should be `async` functions
 *
 */

const R = require('ramda')

const db = {};  // we will populate this obj later via DB.init(db)

const utils = require('./flux/utils')
const handlerUtils = require('./flux/handlers/handlerUtils')



module.exports.hello = async (event, context) => {
  return {message: 'Go Serverless v1.0! Your function executed successfully!'}
};


module.exports.getStats = async (event, context) => {

}


// Last part of file - wrap all handlers to automatically JSON.stringify responses
module.exports = R.mapObjIndexed(handlerUtils.wrapHandler(db), module.exports);
