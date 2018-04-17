/*
 * DB functions for Flux DB (both v1 and v2)
 *
 * Notes:
 * all db functions take an object
 * those objects are guaranteed to have `dbv1` and `dbv2` fields
 * all exports are assumed to be `async` functions
 *
 */


const R = require('ramda')
const MongoClient = require('mongodb').MongoClient;


const utils = require('./utils')


const mongoUrl = process.env.MONGODB_URI
const dbName = R.last(mongoUrl.split('/'))
let dbv1 = {};


let dbv2 = undefined;


const PUB_STATS_ID = 0
const GETINFO_ID = 1


// Helpers for queries - able to be composed with R.merge
const _onRoll = {onAECRoll: true}
const _stateConsent = {state_consent: true}
const _userInState = s => {
    regexDict = {'$regex': utils.state_regex(s)};
    if (s == 'nsw')
        regexDict['$not'] = utils.state_regex('act')
    return {
        '$or': [ {address: regexDict}, {addr_postcode: regexDict} ]
    }
}
const _deetsValid = {detailsValid: true}
const _lastValidatedExists = {lastValidated: {'$exists': true}}


const mkDbV1 = () => new Promise((res, rej) => {
    MongoClient.connect(mongoUrl, (err, client) => {
        if (err !== null) {
            console.error(`mkDbV1 error: ${utils.j(err)}`)
            return rej(err);
        }

        const rawDb = client.db(dbName);

        collections = require('./dbV1Collections')

        const dbv1 = {rawDb, client}
        const setCollection = (i) => { dbv1[i] = rawDb.collection(i) }
        R.map(setCollection, collections);
        console.log(`Created dbv1 obj w keys: ${utils.j(R.keys(dbv1))}`)

        return res(dbv1);
    })
});


const get_version = async () => {
    // (await mongo.db_meta.find_one({'id': {'$eq': 1}}, {'version': 1}))['version']
    return (await dbv1.db_meta.findOne({id: 1})).version;
}


const queryByState = async (qGen) => await Promise.all(R.map(s => {
        return dbv1.users.count(qGen(s)).then(n => [s, n])
    }, utils.all_states)).then(R.fromPairs);


const n_members_on_roll = async () => await dbv1.users.count(_onRoll)

const n_members_raw = async () => await dbv1.users.count({})

const n_members_by_state = async () =>
    await queryByState(s => ({'$and': [_onRoll, _stateConsent, _userInState(s)]}))

const n_members_validated_with_last_validated = async () =>
    await dbv1.users.count({detailsValid: true, lastValidated: {'$exists': true}})

const n_members_validated = n_members_validated_with_last_validated

const n_members_validated_state = async () =>
    await queryByState(s => ({'$and': [
        _deetsValid,
        _lastValidatedExists,
        _stateConsent,
        _userInState(s)
    ]}))

const most_recent_signup = async () =>
    (await dbv1.users.find({}).sort([['timestamp', -1]]).limit(1).toArray())[0].timestamp

const count_double_checked = async () =>
    await dbv1.users.count({needsValidating: false, doubleCheckedValidation: true, detailsValid: true})

const count_double_check_queue = async () =>
    await dbv1.users.count({needsValidating: false, doubleCheckedValidation: true, detailsValid: true})

const count_validation_queue = async () =>
    await dbv1.users.count({needsValidating: true})

const count_validation_queue_state = async () =>
    await queryByState(s => ({
        '$and': [
            {needsValidating: true},
            _stateConsent,
            _userInState(s)
        ]
    }))

const n_volunteers = () => dbv1.users.count({volunteer: true})


const update_getinfo_stats = async () => {
    getinfo = {
        'id': GETINFO_ID,  //  getinfo ID
        'n_members': await n_members_on_roll(),
        'n_members_state': await n_members_by_state(),
        'n_members_raw': await n_members_raw(),
        'n_members_validated': await n_members_validated_with_last_validated(),
        'n_members_validated_state': await n_members_validated_state(),
        'last_member_signup': await most_recent_signup(),
        'double_checked': await count_double_checked(),
        'double_check_queue': await count_double_check_queue(),
        'validation_queue': await count_validation_queue(),
        'validation_queue_state': await count_validation_queue_state(),
        'db_v': await get_version(),
        'last_run': Math.round(Date.now()/1000),
        'n_volunteers': await n_volunteers(),
    }
    console.log(await dbv1.public_stats.findOne({id: GETINFO_ID}))
    await dbv1.public_stats.update({id: GETINFO_ID}, {'$set': getinfo}, {upsert: true})
    return getinfo
}


// set exports + db object
module.exports = {
    init: async (dbObj) => {
        const dbMethods = {
            get_version,
            n_members_raw,
            n_members_on_roll,
            n_members_by_state,
            n_members_validated,
            n_members_validated_state,
            update_getinfo_stats,
        }
        R.mapObjIndexed((f, fName) => { dbObj[fName] = f }, dbMethods);

        dbv1 = await mkDbV1();
        dbv2 = undefined;

        dbObj.close = () => dbv1.client.close();
        return
    }
}
