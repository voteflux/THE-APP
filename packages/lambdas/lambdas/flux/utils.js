const R = require('ramda')

// utils module to avoid repeating common operations.

this.j = obj => JSON.stringify(obj, null, 2),

this.all_states = ['nsw', 'qld', 'sa', 'nt', 'act', 'vic', 'wa', 'tas', 'nostate', 'weirdstate']

this.state_regex = s => {
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


this.stateFromPC = pc => {
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
        if (pc.match(this.state_regex('act')) !== null)
            return 'act'
        return 'nsw'
    }
    return 'nostate'
}


this.extractPostCode = m => {
    if (m.addr_postcode)
       return m.addr_postcode
    return R.last(m.address.toString().match(/[0-9]{4}/g))
}

this.extractState = m => this.stateFromPC(this.extractPostCode(m))

this.countPropInReduce = propName => (acc, obj) => {
    var t = obj[propName]
    if (t === undefined)
        return acc
    if (acc[t] === undefined)
        acc[t] = 0
    acc[t] += 1
    return acc
}





module.exports = this;
