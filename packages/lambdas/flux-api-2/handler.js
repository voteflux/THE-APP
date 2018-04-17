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

const DB = require('./flux/db')
const db = {};  // we will populate this obj later

const utils = require('./flux/utils')


const default200Response = {
  statusCode: 200,
  body: {
    error: false
  }
}


// convenience function for 200 responses
const _r = body => ({
  statusCode: 200,
  body: {error: false, ...body}
});
// convenience for sz-ing json
const j = utils.j



module.exports.hello = async (event, context, callback) => {
  callback(null, {
    message: 'Go Serverless v1.0! Your function executed successfully!',
    input: event,
  });
};



module.exports.genStatsGetinfo = async (event, context, cb) => {
  cb(null, {result: await db.update_getinfo_stats()})
}


// wrap handlers to know about errors, do logging, etc.
const wrapHandler = (f, fName, obj) => (event, context, callback) => {
  console.log(`Wrapping ${fName} now.`)

  const w = cb => (err, resp) => {
    console.log(`CB: ${fName} - {err: ${j(err)}, resp: ${j(resp)}`);

    if (err) {
      throw err;
    }

    return cb(null, _r(resp));
  }

  // f is presumed to be async
  DB.init(db)
    .then(() => f(event, context, w(callback)))
    .then(() => console.log(R.keys(db)))
    .then(() => db.close())
    .catch(err => {
      console.error(`Function ${fName} errored: ${j(err)}`);
      throw err;
    });
}

// Last part of file - wrap all handlers to automatically JSON.stringify responses
module.exports = R.mapObjIndexed(wrapHandler, module.exports);
