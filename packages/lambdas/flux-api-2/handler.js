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
const db = {};  // we will populate this obj later via DB.init(db)

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
  body: j({error: false, ...body})
});
// convenience for sz-ing json
const j = utils.j



module.exports.hello = async (event, context) => {
  return {message: 'Go Serverless v1.0! Your function executed successfully!'}
};



module.exports.genStatsGetinfo = async (event, context) => {
  return {result: await db.update_getinfo_stats()}
}


// wrap handlers to know about errors, do logging, etc.
const wrapHandler = (f, fName, obj) => async (event, context) => {
  console.log(`Wrapping ${fName} now.`)

  let resp, didError = false, err = null;
  try {
    await DB.init(db)  // this populates the global `db` object
    // f is presumed to be async
    resp = await f(event, context)
  } catch (_err) {
    console.error(`Function ${fName} errored: ${j(err)}`)
    didError = true;
    err = _err;
  } finally {
    await db.close()
  }

  console.log(`Got Response from: ${fName} \n- err: ${j(err)}, \n- resp: ${j(resp)}`);

  if (didError) {
    console.log(`Throwing... Error:\n${j(err)}`);
    throw err;
  }
  if (resp.statusCode === undefined) {
    return _r(resp);
  } else {
    return resp;
  }
}

// Last part of file - wrap all handlers to automatically JSON.stringify responses
module.exports = R.mapObjIndexed(wrapHandler, module.exports);
