export enum Routes {
    EditUserDetails = "/membership/details",
    Dashboard = "/",
    ValidateSelf = "/membership/validation",
    MembershipRevocation = "/membership/revoke",

    FinanceMenu = "/admin/finance",
    FinanceDonationLog = "/admin/finance/donations",
    FinanceDonationEntry = "/admin/finance/donations/entry",

    AdminAuditRoles = "/admin/auditRoles",

    VolunteerNdaStatusAndSign = "/volunteers/nda/status",

    ProfileEdit = "/my_profile/:type",

    CandidateDashboard = "/candidates",

    QAndA = "/qanda",
    QandaAskQuestion = "/qanda/ask-a-question",
    QandaReply = "/qanda/reply/:id",
    QandaThread = "/qanda/thread/:id",
};
export default Routes
const R = Routes;

export const pageTitle = (routes, arg1) => {
    const _e = () => { throw Error(`Title for ${routes.path} not set!`) };
    const title = ({
        [R.EditUserDetails]: "My Details",
        [R.Dashboard]: "Dashboard",
        [R.ValidateSelf]: "Electoral Roll Self-Validation",
        [R.MembershipRevocation]: "Revoke Your Membership",

        [R.QAndA]: "Q And A",
        [R.QandaAskQuestion]: "Ask a Question",
        [R.QandaReply]: qTitle => `Reply to ${qTitle}`,
        [R.QandaThread]: qTitle => `Thread (${qTitle})`,

        [R.FinanceMenu]: "Finance Utilities",
        [R.FinanceDonationLog]: "Donation Log",
        [R.FinanceDonationEntry]: "Add a Donation",

        [R.AdminAuditRoles]: "Role Audit (v1)",

        [R.ProfileEdit]: type => `Edit Profile: ${type}`,

        [R.VolunteerNdaStatusAndSign]: "NDA Status",

        [R.CandidateDashboard]: "Candidate Dashboard",
    })[routes.matched[0].path || routes.path];
    return (title.call ? title(arg1 || '...') : title) || _e()
};
