import * as _R from 'ramda'
import { Paginated } from 'flux-lib/types';

export const R = _R

// utils module to avoid repeating common operations.

export const j = obj => JSON.stringify(obj, null, 2) || ""

export const mkPromise = f => (...args) => new Promise((resolve, reject) => {
    f(...args, (err, resp) => {
        if (err)
            return reject(err);
        return resolve(resp);
    })
})

export const genPagination = (total, limit, pageN): Paginated => ({total, limit, pageN})

export const all_states = ['nsw', 'qld', 'sa', 'nt', 'act', 'vic', 'wa', 'tas', 'nostate', 'weirdstate']

export const state_regex = s => {
    const _act_regex = '(260[0-9])|(261[0124567])|(290[0-6])|(291[1-4])'
    const lookup = {
        act: _act_regex,
        // this adds a negative lookahead to discard matches that match ACT
        nsw: `(?!(${_act_regex}))2[0-9]{3}`,
        nt:  '0[0-9]{3}',
        vic: '3[0-9]{3}',
        sa:  '5[0-9]{3}',
        qld: '4[0-9]{3}',
        wa:  '6[0-9]{3}',
        tas: '7[0-9]{3}',
        nostate: '^((?![0-9]{4}).)*$'
    }
    // this addition includes a negative lookahead that makes sure there are no other
    // 4 digit numbers in the match (so should exclude ppl with 4 digits in their address)
    return new RegExp('(' + lookup[s] + '(?!.*[0-9]{4})' + ')')
    // NOTE: might need to add 'g' flag here if some searches aren't working properly
    // -- though not sure if that'll cause unintended consequences
}


export const stateFromPC = (pc = "xxxx") => {
    const lookup = {
        '0': 'nt',
        '3': 'vic',
        '5': 'sa',
        '4': 'qld',
        '6': 'wa',
        '7': 'tas',
    }
    if (lookup[pc[0]])
        return lookup[pc[0]]
    if (pc[0] == '2') {
        if (pc.match(state_regex('act')) !== null)
            return 'act'
        return 'nsw'
    }
    return 'nostate'
}


export const extractPostCode = m => {
    if (m.addr_postcode)
       return m.addr_postcode
    return R.last(m.address.toString().match(/[0-9]{4}/g) || [])
}

export const extractState = m => stateFromPC(extractPostCode(m))

export const countPropInReduce = propName => (acc, obj) => {
    var t = obj[propName]
    if (t === undefined)
        return acc
    if (acc[t] === undefined)
        acc[t] = 0
    acc[t] += 1
    return acc
}


export const getProps = (props, user) => R.fromPairs(R.zip(props, R.props(props, user)))


export const staffSafeProps = [
    'fname', 'sname', 'mnames', 'addr_suburb', 'addr_postcode', 'contact_number', 'email', 'member_comment',
    'dobYear', 'volunteer', 'state_consent', 'onAECRoll', 'detailsValid', 'needsValidating', '_id'
]
export const cleanUserDoc = user => getProps(staffSafeProps, user)
