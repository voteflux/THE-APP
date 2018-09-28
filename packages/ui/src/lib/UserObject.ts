
import { Auth } from 'flux-lib/types/db';
import { UserV1Object } from 'flux-lib/types/db';
import { FluxApiMethods } from './api.d'
import { MsgBus, Messages } from '../messages'

export class UserObject {
    constructor (public user: UserV1Object, private auth: Auth, private $flux: FluxApiMethods) {

    }

    fullName() {
        return `${this.user.fname} ${this.user.mnames} ${this.user.sname}`
    }

    formalAddress() {
        return `${this.user.addr_street_no} ${this.user.addr_street}, ${this.user.addr_suburb}, ${this.user.addr_postcode}, Australia`
    }

    setField(field, val) {
        return this.$flux.v1.saveUserDetails({ [field]: val, ...this.auth })
            .then(r => {
                r.do({
                    success: u => MsgBus.$emit(Messages.GOT_USER_DETAILS, u)
                })
                return r
            })
    }
}
