// utilities for handlers


const DB = require('./flux/db')
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



// wrap handlers to know about errors, do logging, etc.
const wrapHandler = (db) => (f, fName, obj) => async (event, context) => {
  console.log(`Wrapping ${fName} now.`)

  let resp, didError = false, err = null
  try {
    await DB.init(db)  // this populates the global `db` object
    // f is presumed to be async
    resp = await f(event, context)
  } catch (_err) {
    err = _err
    didError = true
    console.error(`Function ${fName} errored: ${err}`)
  } finally {
    await db.close()
  }

  console.log(`Got Response from: ${fName} \n- err: ${j(err)}, \n- resp: ${j(resp)}`);

  if (didError) {
    console.log(`Throwing... Error:\n${j(err)}`)
    throw err
  }
  if (resp.statusCode === undefined) {
    return _r(resp);
  } else {
    return resp;
  }
}


module.exports = {
  wrapHandler,
  j,
  _r,
  default200Response
}
