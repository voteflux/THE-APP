// import Email from 'email-templates'


export type LoginEmailOpts = {name: string, title: string, loginToken: string}

const genLoginEmail = (opts: LoginEmailOpts) => {
    // return new Email({
    //     message: {
    //         from: "login@flux.party"
    //     },
    //     transport: {
    //         ses: true
    //     }
    // })
}

export const renderLoginEmail = async (opts: LoginEmailOpts) => {
    // const email = genLoginEmail(opts)
    // return await email.renderAll("../tmpl/loginEmail", opts)
}

export const sendLoginEmail = async (to: string, opts: LoginEmailOpts) => {
    // const email = genLoginEmail(opts)
    // return await email.send({
    //     locals: opts,
    //     template: "../tmpl/loginEmail",
    //     message: { to }
    // })
}


