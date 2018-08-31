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
R.log = o => {
    console.log(o);
    return o;
}
const MongoClient = require('mongodb').MongoClient;
const {ObjectID} = require('bson');

const utils = require('./utils')


/* DB Utils */

const cleanId = rawId => R.is(ObjectID, rawId) ? rawId : new ObjectID(rawId);


/* DB Setup - v1 */


const mongoUrl = process.env.MONGODB_URI || "mongodb://localhost:27017/flux"
// const dbName = R.last(mongoUrl.split('/'))
let dbv1 = {};


/* DB Setup v2 - might never be used if we keep mongodb... */
let dbv2 = undefined;


/* DB Constants */
const PUB_STATS_ID = 0
const GETINFO_ID = 1


/* DB Helpers for queries - able to be composed with R.merge */
const _rgx = (r) => ({'$regex': r})
const _exists = {'$exists': true}
const _set = s => ({'$set': s})
const _upsert = {'upsert': true}
const _notExists = {'$exists': false}
const _onRoll = {onAECRoll: true}
const _stateConsent = {state_consent: true}
const _userInState = s => {
    rgxPC = _rgx(utils.state_regex(s))
    if (s == 'weirdstate') {
        return {
            '$nor': R.concat(
                R.map(ss => ({address: _rgx(utils.state_regex(ss))}), utils.all_states),
                R.map(ss => ({addr_postcode: _rgx(utils.state_regex(ss))}), utils.all_states),
            )
        }
    }
    return {
        [s == 'nostate' ? '$and' : '$or']: [ {address: rgxPC, addr_postcode: _notExists}, {addr_postcode: rgxPC} ]
    }
}
const _deetsValid = {detailsValid: true}
const _lastValidatedExists = {lastValidated: _exists}
const _volunteer = {volunteer: true}
const _needsValidating = {needsValidating: true}


/* Helper to create DB v1 with accessors for our collections (e.g. `db.users.findOne(...)`) - makes it nicer to use */
const mkDbV1 = () => new Promise((res, rej) => {
    MongoClient.connect(mongoUrl, (err, client) => {
        if (err !== null) {
            console.error(`mkDbV1 error: ${utils.j(err)}`)
            return rej(err);
        }

        const rawDb = client.db();

        collections = require('./dbV1Collections')

        const dbv1 = {rawDb, client}
        const setCollection = (i) => { dbv1[i] = rawDb.collection(i) }
        R.map(setCollection, collections);
        // console.info(`Created dbv1 obj w keys: ${utils.j(R.keys(dbv1))}`)

        return res(dbv1);
    })
});


/* DB Meta calls */
const get_version = async () => {
    // (await mongo.db_meta.find_one({'id': {'$eq': 1}}, {'version': 1}))['version']
    return (await dbv1.db_meta.findOne({id: 1})).version;
}


/* GENERALISED DB CALLS - Used for mass queries / counts. They can be extended with arguments. */


const count_members = (...conds) => dbv1.users.count(conds.length == 0 ? {} : {'$and': conds})

const find_members = (...conds) => dbv1.users.find(conds.length == 0 ? {} : {'$and': conds})

/**
 *
 * @param {(qGen) => Promise<[string, any]>} dbFunc
 *  takes a qGen function and performs the query returned by qGen(state).
 *  this function is run once for each state
 * @param {(state: string) => query: object} qGen
 *  a query that takes a state (lowercase abbreviation) and returns a query
 * @returns {{[state]: [result]}}
 */
const queryByState = async (dbFunc, qGen) =>
    await Promise.all(
        R.map(
            (s) => dbFunc(qGen(s)).then(n => [s, n]),
            utils.all_states
        )
    ).then(R.fromPairs);

const countByState = async (qGen) => await queryByState((q) => dbv1.users.count(q), qGen)

const findByState = async (qGen) => await queryByState((q) => dbv1.users.find(q), qGen)


/* SPECIFIC DB CALLS */

/* Aggregate Member Calls */

const n_members_by_state = async () =>
    await countByState(s => ({'$and': [_onRoll, _stateConsent, _userInState(s)]}))

const n_members_by_state_raw = async (...conds) =>
    await countByState(s => ({'$and': [...conds, _userInState(s)]}))

const n_members_validated_with_last_validated = async () =>
    await count_members(_deetsValid, _lastValidatedExists)

const n_members_validated = n_members_validated_with_last_validated

const n_members_validated_state = async () =>
    await countByState(s => ({'$and': [
        _deetsValid,
        _lastValidatedExists,
        _stateConsent,
        _userInState(s)
    ]}))

const most_recent_signup = async () =>
    (await find_members().sort([['timestamp', -1]]).limit(1).toArray())[0].timestamp

const count_double_checked = async () =>
    await count_members({doubleCheckedValidation: true}, _needsValidating, _deetsValid, _onRoll)

const count_double_check_queue = async () =>
    await count_members({doubleCheckedValidation: false}, _needsValidating, _deetsValid, _onRoll)

const count_validation_queue = async () =>
    await count_members(_onRoll, _needsValidating)

const count_validation_queue_state = async () =>
    await countByState(s => ({
        '$and': [
            {needsValidating: true},
            _stateConsent,
            _onRoll,
            _userInState(s)
        ]
    }))

const count_volunteers = () => count_members(_volunteer)

/* Finance */

const getDonations = async (pageN = 0, limit = 10) =>
    await dbv1.donations.find({}, {sort: [['ts', 1]], limit, skip: pageN * limit}).toArray()

const getDonationsN = async () =>
    await dbv1.donations.count()


/* Member Specific Calls */

/* User calls */

const getUidFromS = async s =>
    await dbv1.users.findOne({s}, {projection: {_id: 1}})

const getUserFromS = async s =>
    await dbv1.users.findOne({s})

const getUserFromUid = async userId => {
    const _id = cleanId(userId);
    return await dbv1.users.findOne({_id})
}

/* Role Calls */

// Role schema: {role: string, uids: uid[], _id}

const getUserRoles = async userId => {
    const _id = cleanId(userId)
    const rolesAll = await dbv1.roles.find({'uids': _id}).toArray()
    return R.map(R.prop('role'), rolesAll)
}

/**
 * Return a list of all roles along with the users that have each role.
 * @returns {{role: string, users: User[]}[]} List of all roles as an object with keys `role` and `users`. The `users` key is a list of user objects.
 */
const getRoleAudit = async () => {
    const rolesAll = await dbv1.roles.find({}).toArray()
    const uniqueUserIDs = R.compose(R.uniq, R.reduce(R.concat, []), R.map(R.prop('uids')))(rolesAll)
    const userMap = await Promise.all(R.map(uid => getUserFromUid(uid).then(u => [uid, u]), uniqueUserIDs)).then(R.fromPairs)
    return R.map(({role, uids}) => ({role, users: R.map(u => userMap[u], uids)}), rolesAll)
}

/* STATS */


const update_getinfo_stats = async () => {
    getinfo = {
        id: GETINFO_ID,  //  getinfo ID
        n_members: await count_members(_onRoll),
        n_members_w_state_consent: await count_members(_onRoll, _stateConsent),
        n_members_state: await n_members_by_state(),
        n_members_state_raw: await n_members_by_state_raw(),
        n_members_raw: await count_members(),
        n_members_validated: await n_members_validated_with_last_validated(),
        n_members_validated_state: await n_members_validated_state(),
        last_member_signup: await most_recent_signup(),
        double_checked: await count_double_checked(),
        double_check_queue: await count_double_check_queue(),
        validation_queue: await count_validation_queue(),
        validation_queue_state: await count_validation_queue_state(),
        db_v: await get_version(),
        last_run: Math.round(Date.now()/1000),
        n_volunteers: await count_volunteers(),
    }
    await dbv1.public_stats.update({id: GETINFO_ID}, _set(getinfo), _upsert)
    return getinfo
}

const update_public_stats = async () => {
    const stats = {id: PUB_STATS_ID}

    const all_members = await find_members(_onRoll).project({timestamp: 1, address: 1, addr_postcode: 1, dobYear: 1}).toArray()
    console.log(`Public Stats generator got ${all_members.length} members`)

    stats.signup_times = R.compose(R.sort((a,b) => b - a), R.map(m => m.timestamp | 0), R.filter(m => m.timestamp !== undefined))(all_members)
    console.log(`SIGNUP_TIMES: N=${stats.signup_times.length}, ${stats.signup_times.toString().slice(0,300)}`)

    stats.dob_years = R.compose(R.countBy(R.prop('dobYear')), R.filter(m => m.dobYear !== undefined))(all_members)

    const pcs = R.compose(R.filter(R.compose(R.not, R.isNil)), R.map(utils.extractPostCode))(all_members)
    stats.postcodes = R.countBy(R.identity, pcs);

    stats.states = R.compose(R.countBy(R.identity), R.map(utils.stateFromPC))(pcs)

    stats.state_dob_years = R.compose(R.map(R.countBy(R.identity)), R.map(R.map(R.last)), R.groupBy(R.head), R.map(m => [utils.extractState(m), m.dobYear || "1066"]))(all_members)

    stats.state_signup_times = R.compose(R.map(R.sort((a,b) => a - b)), R.map(R.map(R.last)), R.groupBy(R.head), R.map(m => [utils.extractState(m), (m.timestamp || 0) | 0]))(all_members)

    stats.last_run = (Date.now()/1000) | 0
    await dbv1.public_stats.update({id: PUB_STATS_ID}, _set(stats), _upsert)
    return stats
}


/* MODULE EXPORTS */


// set exports + db object
module.exports = {
    init: async (dbObj) => {
        const dbMethods = {
            /* meta */
            get_version,
            /* members */
            count_members,
            n_members_by_state,
            n_members_validated,
            n_members_validated_state,
            /* stats */
            update_getinfo_stats,
            update_public_stats,
            /* personal / per member */
            getUserFromS,
            getUserFromUid,
            getUidFromS,
            getUserRoles,
            /* finance */
            getDonations,
            getDonationsN,
            /* admin */
            getRoleAudit,
        }
        R.mapObjIndexed((f, fName) => { dbObj[fName] = f }, dbMethods);

        dbv1 = await mkDbV1();
        dbv2 = undefined;

        dbObj.close = () => dbv1.client.close();
        return
    }
}
