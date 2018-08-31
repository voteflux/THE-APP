export type PublicStats = {
    signup_times: number[],
    dob_years: string[],
    postcodes: string[],
    states: {
        [state: string]: number,
    },
    state_dob_years: {
        [state: string]: {[dobYr:string]: number},
    },
    state_signup_times: {
        [state: string]: number[],
    },
    last_run: number
}
