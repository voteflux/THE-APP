import { DB } from './../db';
const R = require('ramda');

const fail = msg => ({statusCode: 403, body: msg})

const checkAuthOfRole = (db: DB) => (role, f) => async (event, context) => {
    const data = event.body

    if (data['s']) {
        //pass
    } else {
        if (!data.authToken) {
            return fail('no auth')
        } else {
            // implement authToken later
            return fail('authToken not yet implemented')
        }
    }

    if (R.is(String, data.s) && data.s === data.s.toString()) {
        if (data.s.length < 1 || data.s.length > 50) {
            return fail('bad auth')
        }
    } else {
        return fail('bad s param')
    }

    const user = await db.getUserFromS(data.s)

    if (user && user.s !== data.s) {
        return fail('auth failed')
    }

    if (role !== 'user') {  // special role
        // check we have the role
        const roles = await db.getUserRoles(user._id)
        if (roles.includes(role) || roles.includes('admin')){
            // then we are okay
        } else {
            return fail('insufficient permissions')
        }
    }
    return await f(event, context, {user})
}

const auth = (db) => ({
    user: (f) => checkAuthOfRole(db)('user', f),
    role: checkAuthOfRole(db)

    // async (event, context) => {
    //     const data = event.body

    //     if (data['s']) {
    //         //pass
    //     } else {
    //         if (!data.authToken) {
    //             return fail('no auth')
    //         } else {
    //             // implement authToken later
    //             return fail('authToken not yet implemented')
    //         }
    //     }

    //     if (R.is(String, data.s) && data.s === data.s.toString()) {
    //         if (data.s.length < 20 || data.s.length > 50) {
    //             return fail('bad auth')
    //         }
    //     } else {
    //         return fail('bad s param')
    //     }

    //     const user = await db.getUserFromS(data.s)

    //     if (user && user.s === data.s) {
    //         return await f(event, context, {user});
    //     }
    //     // default if above fails
    //     return fail('auth failed')
    // },
})

module.exports = auth;
