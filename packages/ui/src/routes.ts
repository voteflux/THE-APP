export enum Routes {
    EditUserDetails = "/membership/details",
    Dashboard = "/",
    ValidateSelf = "/membership/validation",
    MembershipRevocation = "/membership/revoke",
    FinanceMenu = "/admin/finance",
    FinanceDonationLog = "/admin/finance/donations",
    FinanceDonationEntry = "/admin/finance/donations/entry",
    AdminAuditRoles = "/admin/auditRoles",

    VolunteerDashboard = "/volunteers",
    // VolunteerSignNDA = "/volunteers/sign-nda",

    CandidateDashboard = "/candidates",
};
export default Routes
const R = Routes

export const pageTitle = (route: Routes) => {
    const _e = () => { throw Error(`Title for ${route} not set!`) }
    return ({
        [R.EditUserDetails]: "Your Details",
        [R.Dashboard]: "Dashboard",
        [R.ValidateSelf]: "Electoral Roll Self-Validation",
        [R.MembershipRevocation]: "Revoke Your Membership",
        [R.FinanceMenu]: "Finance Utilities",
        [R.FinanceDonationLog]: "Donation Log",
        [R.FinanceDonationEntry]: "Add a Donation",
        [R.AdminAuditRoles]: "Role Audit (v1)",
        [R.VolunteerDashboard]: "Volunteer Dashboard",
        [R.CandidateDashboard]: "Candidate Dashboard",
    })[route] || _e()
}
