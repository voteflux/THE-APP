import { SortMethod } from "./db";

import * as _R from "ramda";

import { MongoClient, FilterQuery, FindOneOptions } from "mongodb";
import { ObjectID } from "bson";

import * as utils from "./utils";
import { DBV1, UserV1Object, PublicStats, Donation, DBV2, collections } from 'flux-lib/types/db'
import DBCheckCache from "./db/cache";
import { NdaStatus, NdaStage, NdaDraftCommit } from 'flux-lib/types/db/vols';
import DBAuthSecToken2 from "./db/authSecToken2";
import { ThenArg } from 'flux-lib/types/utils/promises'
import { throwIfNull } from 'flux-lib/utils'
import DBOneTimeTokens from './db/oneTimeTokens'

/*
 * DB functions for Flux DB (both v1 and v2)
 *
 * Notes:
 * all db functions take an object
 * those objects are guaranteed to have `dbv1` and `dbv2` fields
 * all exports are assumed to be `async` functions
 *
 */

const R = {
    ..._R,
    log: o => {
        console.log(o);
        return o;
    }
};

export { SortMethod } from "flux-lib/types/db";
const SM = SortMethod;

const renderSM = (sm: SortMethod): [[string, number]] => {
    return (<{ [k: string]: [[string, number]] }>{
        [SM.TS]: [["ts", -1]],
        [SM.ID]: [["_id", -1]]
    })[sm || SM.TS];
};

/* DB Utils */

const cleanId = rawId => (R.is(ObjectID, rawId) ? rawId : new ObjectID(rawId));

/* DB Setup - v1 */

const mongoUrl: string = process.env.MONGODB_URI || "MONGO_URI NOT SET"
// const dbName = R.last(mongoUrl.split('/'))
let dbv1 = {} as DBV1;

/* DB Setup v2 - might never be used if we keep mongodb... */
let dbv2 = undefined;

/* DB Constants */
const PUB_STATS_ID = 0;
const GETINFO_ID = 1;

/* DB Helpers for queries - able to be composed with R.merge */
export const _rgx = r => ({ $regex: r });
export const _exists = { $exists: true };
export const _set = s => ({ $set: s });
export const _push = e => ({ $push: e });
export const _lt = n => ({ $lt: n });
export const _gt = n => ({ $gt: n });
export const _eq = n => ({ $eq: n });
export const _true = _eq(true)
export const _false = _eq(false)
export const _upsert = { upsert: true };
export const _notExists = { $exists: false };
export const _onRoll = { onAECRoll: true };
export const _stateConsent = { state_consent: true };
export const _shouldRecheckValidation = () =>
    ({ lastValidated: { $lt: (((new Date()).getTime() / 1000) | 0) - 60*60*24*90 } })
export const _shouldValidateCriteria = () => ({ $or: [
    { needsValidating: true },
    { $and: [_deetsValid, _shouldRecheckValidation()] }
]})
export const _userInState = s => {
    const rgxPC = _rgx(utils.state_regex(s));
    if (s == "weirdstate") {
        return {
            $nor: R.concat(
                // @ts-ignore
                R.map(ss => ({ address: _rgx(utils.state_regex(ss)) }), utils.all_states),
                R.map(ss => ({ addr_postcode: _rgx(utils.state_regex(ss)) }), utils.all_states)
            )
        };
    }
    return {
        [s == "nostate" ? "$and" : "$or"]: [{ address: rgxPC, addr_postcode: _notExists }, { addr_postcode: rgxPC }]
    };
};
export const _deetsValid = { detailsValid: true };
export const _deetsNotValid = { detailsValid: false };
export const _lastValidatedExists = { lastValidated: _exists };
export const _volunteer = { volunteer: true };
export const _needsValidating = { needsValidating: true };

/* Helper to create DB v1 with accessors for our collections (e.g. `db.users.findOne(...)`) - makes it nicer to use */
export const mkDbV1 = (uri: string = mongoUrl): Promise<DBV1> =>
    new Promise((res, rej) => {
        MongoClient.connect(
            uri,
            (err, client) => {
                if (err !== null) {
                    console.error(`mkDbV1 error: ${utils.j(err)}`);
                    return rej(err);
                }

                const rawDb = client.db();

                let _dbv1 = { rawDb, client };
                const setCollection = i => {
                    _dbv1[i] = rawDb.collection(i);
                };
                R.map(setCollection, collections);
                console.info(`Created dbv1 obj w keys: ${utils.j(R.keys(dbv1))}`)

                return res({ ..._dbv1 } as DBV1);
            }
        );
    });


/* SPECIFIC DB CALLS */

/* Member Specific Calls */




export enum Qs {
    Q_RECEIPTS = "RECEIPTS"
}


/* MODULE EXPORTS */

export class DBMethods {
    public secToken2: DBAuthSecToken2
    public cache: DBCheckCache
    public oneTimeTokens: DBOneTimeTokens

    constructor(public dbv1: DBV1, public dbv2: DBV2) {
        this.secToken2 = new DBAuthSecToken2(dbv1, dbv2, this)
        this.cache = new DBCheckCache(dbv1, dbv2, this)
        this.oneTimeTokens = new DBOneTimeTokens(dbv1, dbv2, this)
    }

    close() {
        return this.dbv1.client.close();
    }

    /* meta */

    /* DB Meta calls */
    async get_version() {
        return (await this.dbv1.db_meta.findOne({ id: 1 })).version;
    }
    /* GENERALISED DB CALLS - Used for mass queries / counts. They can be extended with arguments. */
    count_members = (...conds) => this.dbv1.users.count(conds.length == 0 ? {} : { $and: conds });
    find_members = (...conds) => this.dbv1.users.find(conds.length == 0 ? {} : { $and: conds });

    /* Utils */

    /**
     *
     * @param {(qGen) => Promise<[string, any]>} dbFunc
     *  takes a qGen function and performs the query returned by qGen(state).
     *  this function is run once for each state
     * @param {(state: string) => query: object} qGen
     *  a query that takes a state (lowercase abbreviation) and returns a query
     * @returns {{[state]: [result]}}
     */
    queryByState = async (dbFunc, qGen) => await Promise.all(R.map(s => dbFunc(qGen(s)).then(n => [s, n]), utils.all_states)).then(R.fromPairs);

    countByState = async qGen => await this.queryByState(q => this.dbv1.users.count(q), qGen);

    findByState = async qGen => await this.queryByState(q => this.dbv1.users.find(q), qGen);

    /* Aggregate Member Calls */

    n_members_by_state = async () => await this.countByState(s => ({ $and: [_onRoll, _stateConsent, _userInState(s)] }));

    n_members_by_state_raw = async (...conds) => await this.countByState(s => ({ $and: [...conds, _userInState(s)] }));

    n_members_validated_with_last_validated = async () => await this.count_members(_deetsValid, _lastValidatedExists);

    n_members_validated = this.n_members_validated_with_last_validated;

    n_members_validated_state = async () =>
        await this.countByState(s => ({
            $and: [_deetsValid, _onRoll, _lastValidatedExists, _stateConsent, _userInState(s)]
        }));

    n_members_not_valid_state = async () =>
        await this.countByState(s => ({
            $and: [_deetsNotValid, _onRoll, _stateConsent, _userInState(s)]
        }))

    most_recent_signup = async () =>
        (await this.find_members()
            .sort([["timestamp", -1]])
            .limit(1)
            .toArray())[0].timestamp;

    count_double_checked = async () => await this.count_members({ doubleCheckedValidation: true }, _needsValidating, _deetsValid, _onRoll);

    count_double_check_queue = async () => await this.count_members({ doubleCheckedValidation: false }, _needsValidating, _deetsValid, _onRoll);

    count_validation_queue = async () => await this.count_members(_onRoll, _shouldValidateCriteria());

    count_validation_queue_state = async () =>
        await this.countByState(s => ({
            $and: [
                _shouldValidateCriteria(),
                _onRoll,
                _stateConsent,
                _userInState(s),
            ]
        }));

    count_volunteers = () => this.count_members(_volunteer);

    /* validation */

    get_member_needing_validation = async (state=null, extraConds={}) => {
        const conditions = {
            '$or': [
                // not validated within last 90 days
                {needsValidating: _false, ..._shouldRecheckValidation()},
                {needsValidating: _true, lastValidated: _notExists},
                {needsValidating: _true, lastValidationGet: { $lt: utils.now() - 60 }},
                {needsValidating: _true, lastValidationGet: null}
            ],
            ...(extraConds || {}),
            ...(state ? _userInState(state) : {})
        }
        return await this.dbv1.users.findOneAndUpdate(conditions,
            {'$set': {'lastValidationGet': utils.now()}},
            {sort: [['lastValidationGet', 1]]}
        )
    }

    /* stats */

    update_getinfo_stats = async () => {
        let getinfo = {
            id: GETINFO_ID, //  getinfo ID
            n_members: await this.count_members(_onRoll),
            n_members_w_state_consent: await this.count_members(_onRoll, _stateConsent),
            n_members_state: await this.n_members_by_state(),
            n_members_state_raw: await this.n_members_by_state_raw(),
            n_members_raw: await this.count_members(),
            n_members_validated: await this.n_members_validated_with_last_validated(),
            n_members_validated_state: await this.n_members_validated_state(),
            n_members_not_valid_state: await this.n_members_not_valid_state(),
            last_member_signup: await this.most_recent_signup(),
            double_checked: await this.count_double_checked(),
            double_check_queue: await this.count_double_check_queue(),
            validation_queue: await this.count_validation_queue(),
            validation_queue_state: await this.count_validation_queue_state(),
            db_v: await this.get_version(),
            last_run: (Date.now() / 1000) | 0,
            n_volunteers: await this.count_volunteers()
        };
        await this.dbv1.public_stats.update({ id: GETINFO_ID }, _set(getinfo), _upsert);
        // print(getinfo)
        return getinfo;
    };

    update_public_stats = async (): Promise<PublicStats> => {
        const stats = <any>{ id: PUB_STATS_ID };

        const all_members = (await this.find_members(_onRoll)
            .project({ timestamp: 1, address: 1, addr_postcode: 1, dobYear: 1 })
            .toArray()) as any[];
        console.log(`Public Stats generator got ${all_members.length} members`);

        stats.signup_times = R.compose(
            R.sort((a: any, b: any) => b - a),
            // @ts-ignore
            R.map(m => m.timestamp | 0),
            R.filter((m: any) => m.timestamp !== undefined)
        )(all_members);
        console.log(`SIGNUP_TIMES: N=${stats.signup_times.length}, ${stats.signup_times.toString().slice(0, 300)}`);

        stats.dob_years = R.compose(
            // @ts-ignore
            R.countBy(R.prop("dobYear")),
            R.filter((m: any) => m.dobYear !== undefined)
        )(all_members);

        const pcs = R.compose(
            R.filter(
                R.compose(
                    R.not,
                    R.isNil
                )
            ),
            R.map(utils.extractPostCode)
        )(all_members);
        // @ts-ignore
        stats.postcodes = R.countBy(R.identity, pcs);

        stats.states = R.compose(
            // @ts-ignore
            R.countBy(R.identity),
            R.map(utils.stateFromPC)
        // @ts-ignore
        )(pcs);

        stats.state_dob_years = R.compose(
            // @ts-ignore
            R.map(R.countBy(R.identity)),
            // @ts-ignore
            R.map(R.map(R.last)),
            R.groupBy(R.head),
            // @ts-ignore
            R.map(m => [utils.extractState(m), m.dobYear || "1066"])
        )(all_members);

        stats.state_signup_times = R.compose(
            // @ts-ignore
            R.map(R.sort((a, b) => a - b)),
            // @ts-ignore
            R.map(R.map(R.last)),
            R.groupBy(R.head),
            // @ts-ignore
            R.map(m => [utils.extractState(m), (m.timestamp || 0) | 0])
        )(all_members);

        stats.last_run = (Date.now() / 1000) | 0;
        await this.dbv1.public_stats.update({ id: PUB_STATS_ID }, _set(stats), _upsert);
        return stats as PublicStats;
    };

    /* User calls */

    async getUidFromS(s) {
        return await this.dbv1.users.findOne({ s }, { projection: { _id: 1 } });
    }

    async getUserFromS(s) {
        return await this.dbv1.users.findOne({ s });
    }

    async getUserFromUid(userId) {
        const _id = cleanId(userId);
        return await this.dbv1.users.findOne({ _id }).then(throwIfNull('Unknown User'))
    }

    async getUserFromEmail(email) {
        return await this.dbv1.users.findOne({ email });
    }

    /* Volunteer Calls */

    // status of a member
    async getNdaStatus(_id): Promise<NdaStatus | null> {
        return await this.dbv1.volNdaStatus.findOne({ uid: _id })
    }

    // record nda
    insertFreshNdaPdfAndSig = async (_id, pdf, sig): Promise<NdaStatus> => {
        const ndaStatusToSet = { pdfDataUri: pdf, signatureDataUri: sig, stage: NdaStage.AWAITING_APPROVAL }
        await this.dbv1.volNdaStatus.updateOne({ uid: _id }, _set(ndaStatusToSet), { upsert: true })
        return ndaStatusToSet
    }

    // draft NDA
    commitDraftNda = async (uid, pdfHash, sigHash, acceptSig): Promise<NdaDraftCommit> => {
        const draftCommit = { uid, pdfHash, sigHash, ts: utils.now(), acceptSig }
        await this.dbv1.volNdaDraftCommits.insertOne(draftCommit)
        return draftCommit
    }

    acceptDraftNda = async (uid, pdfHash, sigHash): Promise<NdaStatus> => {
        // return await this.dbv1.vol
        return {} as any
    }

    /* Finance */

    getDonations = async (pageN = 0, limit = 10, sortMethod: SortMethod = SM.TS, query: FilterQuery<Donation> = {}): Promise<Donation[]> => {
        return await this.dbv1.donations.find(query, { sort: renderSM(sortMethod), limit, skip: pageN * limit }).toArray();
    };

    getDonationsN = async () => await this.dbv1.donations.count();



    // Role schema: {role: string, uids: uid[], _id}

    getUserRoles = async (userId): Promise<string[]> => {
        const _uid = cleanId(userId);
        const rolesAll = await this.dbv1.roles.find({ uids: _uid }).toArray();
        return R.map(R.prop("role"), rolesAll);
    };

    /**
     * Return a list of all roles along with the users that have each role.
     * @returns {{role: string, users: User[]}[]} List of all roles as an object with keys `role` and `users`. The `users` key is a list of user objects.
     */
    getRoleAudit = async (): Promise<{ role: string; users: UserV1Object[] }[]> => {
        const rolesAll = await this.dbv1.roles.find({}).toArray();
        const uniqueUserIDs = R.compose(
            // @ts-ignore
            R.uniq,
            // @ts-ignore
            R.reduce(R.concat, []),
            R.map(R.prop("uids"))
        )(rolesAll);
        // @ts-ignore
        const userMap = await Promise.all(R.map(uid => this.getUserFromUid(uid).then(u => [uid, u]), uniqueUserIDs)).then(R.fromPairs);
        // @ts-ignore
        return R.map(({ role, uids }) => ({ role, users: R.map(u => userMap[u], uids) }), rolesAll);
    };

    /* Generic Queues */


    listAllQueues = async (): Promise<string[]> => {
        return await this.dbv1.generic_queues.distinct("queue_enum", {});
    };

    countQueue = async (queue_enum: Qs): Promise<number> => {
        return await this.dbv1.generic_queues.count({ queue_enum, in_progress: false, tries: { $lt: 2 } });
    };

    addToQueue = async (queue_enum: Qs, doc): Promise<any> => {
        return await this.dbv1.generic_queues.insertOne({
            sent: false,
            ts: utils.now(),
            tries: 0,
            send_log: [],
            options: doc,
            in_progress: false,
            queue_enum
        });
    };

    getFromQueue = async (queue_enum: Qs): Promise<any> => {
        return await this.dbv1.generic_queues.findOneAndUpdate(
            {
                queue_enum,
                in_progress: false,
                sent: false,
                tries: _lt(2)
            },
            _set({ in_progress: true })
        );
    };

    updateQueue = async (queue_enum: Qs, doc, success, reason): Promise<any> => {
        const updates = {
            ..._set({
                in_progress: false,
                sent: success === true,
                tries: doc["tries"] + 1
            }),
            ..._push({ send_log: `(${queue_enum}) SENT_${success ? "GOOD" : "FAIL"} @ ${utils.now()} : ${reason}` })
        };
        return await this.dbv1.generic_queues.findOneAndUpdate({ _id: doc._id }, updates);
    };
}

// set exports + db object
export const init = async (dbObj = {}, dbV1Uri = mongoUrl) => {
    dbv1 = await mkDbV1(dbV1Uri);
    dbv2 = undefined;

    const dbMethods = new DBMethods(dbv1, dbv2);



    return dbMethods;
};

export default { init };

export type DB = ThenArg<ReturnType<typeof init>>;
