

export const emailRules = [
    v => !!v || 'E-mail is required',
    v => /.+@.+/.test(v) || 'E-mail must be valid'
]

export const nameRules = [
    v => !!v || 'Name is required',
    v => true || 'Name should be valid'
]
