// utils module to avoid repeating common operations.

this.j = obj => JSON.stringify(obj, null, 2),

this.all_states = ['nsw', 'qld', 'sa', 'nt', 'act', 'vic', 'wa', 'tas']

this.state_regex = s => {
    const _act_regex = /(260[0-9])|(261[0124567])|(290[0-6])|(291[1-4])/
    const lookup = {
        act: _act_regex,
        nsw: /2[0-9]{3}/,
        nt: /0[0-9]{3}/,
        vic: /3[0-9]{3}/,
        sa: /5[0-9]{3}/,
        qld: /4[0-9]{3}/,
        wa: /6[0-9]{3}/,
        tas: /7[0-9]{3}/,
    }
    return lookup[s]
}


module.exports = this;
