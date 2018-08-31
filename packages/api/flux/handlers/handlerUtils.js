// utilities for handlers


const DB = require('../db')
const utils = require('../utils')
const R = utils.R;

// convenience function for 200 responses
const _r = body => ({
  statusCode: 200,
  body: JSON.stringify(body)
});


const beforeSend = (response) => {
  response.headers = utils.R.merge({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*"
  }, response.headers || {})
  return response
}


const beforeEnter = f => (event, context) => {
  if (R.is(String, event.body)) {
    try {
      event.body = JSON.parse(event.body)
    } catch (e) {}
  }
  return f(event, context)
}


// convenience for sz-ing json
const j = utils.j



// wrap handlers to know about errors, do logging, etc.
const wrapHandler = (db) => (f, fName, obj) => async (event, context) => {
  console.log(`Wrapping ${fName} now.`)

  let resp, didError = false, err = null
  try {
    await DB.init(db)  // this populates the global `db` object
    // f is presumed to be async
    resp = await beforeEnter(f)(event, context)
  } catch (_err) {
    err = _err
    didError = true
    if (err.message.indexOf("Cannot destructure property") >= 0) {
      const field = err.message.split('`')[1];
      if (field) {
        err = `Field '${field}' is required.`
      } else if (process.env.STAGE !== 'dev') {
        console.error(_err);
        err = "An unknown error occurred. It has been logged."
      }
    }
    console.error(`Function ${fName} errored: ${err}`)
  } finally {
    await db.close()
  }

  console.log(`Got Response from: ${fName} \n- err: ${err}, \n- resp: ${j(resp || {}).slice(0,256)}`);

  if (didError) {
    console.log(`Throwing... Error:\n${err}`)
    throw err
  }
  if (resp.statusCode === undefined) {
    return beforeSend(_r(resp));
  } else {
    return beforeSend(resp);
  }
}


module.exports = {
  wrapHandler,
  j,
  _r
}
