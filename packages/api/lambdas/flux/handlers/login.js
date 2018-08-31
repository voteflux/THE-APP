'use strict';

const R = require('ramda')

const db = {};  // we will populate this obj later via DB.init(db)

const utils = require('../utils')
const aws = require('aws-sdk');
const cognito = require('../aws/cognito')
const handlerUtils = require('./handlerUtils')


module.exports.checkEmail = async (event, context) => {
    return {error: 503}

    const {email} = event;

    const p = {
        ...cognito.common,
        AttributesToGet: null,
    }
    const r = await cognito.identity.listUsers(p)
    console.log(r);

    return {};
};



// Last part of file - wrap all handlers to automatically JSON.stringify responses
module.exports = R.mapObjIndexed(handlerUtils.wrapHandler(db), module.exports);
