const aws = require('aws-sdk')
const config = require('../config')

const utils = require('../utils')

const common = {
    UserPoolId: process.env.USER_POOL_ID
}

const _identity = new aws.CognitoIdentityServiceProvider({...common})

const identity = new Proxy({}, {
    get: (obj, prop) =>
        utils.mkPromise(_identity[prop].bind(_identity))
});


module.exports = {
    // userPool,
    identity,
    _identity,
    common,
}
