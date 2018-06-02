var app = angular.module('fluxMembersApp', []);

app.controller('FluxController', function($scope, $log, $rootScope, $http, $window){
    //
    // Variables needed
    //

    $rootScope._ = _;

    var flux = this;

    flux.searching = false;
    flux.searchWhat = 'name';
    flux.fieldContains = '';
    flux.errorMsg = '';
    flux._currentTab = 'search-members';
    flux.page = 0;
    flux.totalPages = 0;
    flux.n_members = 50;
    flux.authToken = getAuthToken();
    flux.um = {};  // user modification state
    flux.loggedInUser = {};
    flux.input = { regoWarn : {}, };

    flux.isProd = () => {
        return window.location.hostname === "members.flux.party";
    }

    flux.rego = {
        revalidation: false,
        jurisdiction: '/AUS',
        n_required_members: 550,
    };

    flux.regoGet = {
        jurisdiction: '/AUS',
    }

    flux.regoSend = {
        msg: "Put message here...",
        jurisdiction: '/AUS',
        send_to_all: true,
        send_test: true,
        test_number: "0402713219",
        subject: "",
        invalid_only: false,
        email_only: true,
        dry_run: true,
    }

    flux.partyList = {
        jurisdiction: '/AUS',
        resp: "Party list will go here when it's loaded",
        updated: new Date(),
    }

    flux.partyListCalling = {
        juri: '/AUS',
        resp: "Party list will go here when it's loaded",
        updated: new Date(),
    }

    if (document.location.hostname == 'localhost' || document.location.hostname == '127.0.0.1'){
        flux.debug = true;
    }

    //
    // Functions: api
    //

    flux.api = function(path){
        return flux_api(path, flux.debug);
    };

    //
    // functions utils
    //

    flux.handleError = function(error){
        flux._showError(error);
        $log.log('Got Error:', error);
        flux.showLoading = false;
        flux.searching = false;
    };
    flux._showError = function(error){
        if(typeof error === 'object'){
            if (error.status){
                if(error.status == 403){
                    flux.errorMsg = 'Forbidden Error - Are Authentication Details Correct?'
                }
            } else {
                flux.errorMsg = JSON.stringify(error);
            }
        } else {
            flux.errorMsg = error;
        }
    };

    flux.logDeets = function(m){
        $log.log(m);
    }

    flux.stateFromJuri = (juri) => {
        const upperState = juri.split('/')[2];
        if (upperState) {
            return upperState.toLowerCase();
        } else {
            return '';
        }
    }

    flux.setTab = function(newTab){ flux._currentTab = newTab; }
    flux.isTab = function(tab){ return flux._currentTab == tab; }

    ///
    /// LOGIN
    ///

    flux.renderLoggedInName = () => {
        const u = flux.loggedInUser;

        if (u.fname) {
            return [u.fname, u.mnames || '', u.sname].join(' ');
        }
        if (u.name) {
            return u.name;
        }
        return 'No logged in user';
    }

    flux.attemptLogin = () => {
        const postdata = {
            s: flux.authToken
        };
        $http.post(flux.api('api/v0/user_details'), postdata)
            .then(data => {
                flux.loggedInUser = data.data;
                console.log('logged in as', flux.loggedInUser)
            }).catch(flux.handleError);
    }

    ///
    /// Party List
    ///

    flux.dumpMembers = () => {
        const postdata = {
            s: flux.authToken,
            state: flux.stateFromJuri(flux.partyList.jurisdiction)
        }
        $http.post(flux.api('api/v0/all_members_formatted'), postdata)
            .then(data => {
                const resp = data.data;
                flux.partyList.msg = resp;
                flux.partyList.updated = new Date();
            }).catch(flux.handleError)
    }

    flux.dumpMembersCalling = () => {
        const postdata = {
            s: flux.authToken,
            state: flux.stateFromJuri(flux.partyListCalling.juri)
        }
        $http.post(flux.api('api/v0/all_members_juri_for_calling'), postdata)
            .then(data => {
                const resp = data.data;
                flux.partyListCalling.msg = resp;
                flux.partyListCalling.updated = new Date();
            }).catch(flux.handleError)
    }

    ///
    /// Search Functions
    ///

    flux.search = () => {
        flux.searching = true;
        var rq = {'$regex': flux.fieldContains}  // regex query

        var q_lookup = {
            'name': () => {
                return {'$or': [{'name': rq}, {'fname': rq}, {'mnames': rq}, {'sname': rq}]}
            },
            'address': () => {
                return {'$or': [{addr_street: rq}, {addr_suburb: rq}, {address: rq}]}
            },
            'postcode': () => {
                return {'$or': [{addr_postcode: rq}, {address: rq}]}
            },
            'email': () => {
                return {email: rq}
            }
        }

        var postdata = {'query': q_lookup[flux.searchWhat](), 's': flux.authToken, 'page': flux.page}
        $http.post(flux.api('api/v0/subset_members'), postdata).then(
        (data) => {
            data = data['data'];
            flux.members = data['members'];
            flux.searchTotal = data['n_members'];
            flux.totalPages = Math.ceil(flux.searchTotal / flux.n_members);
            flux.searching = false;
        }, flux.handleError);
    }

    flux.markReliable = (m) => {
        flux.updateUserReliable(m, true);
    }
    flux.markUnreliable = (m) => {
        flux.updateUserReliable(m, false);
    }
    flux.updateUserReliable = (m, reliable) => {
        console.log(m)
        const postdata = {
            s: flux.authToken,
            reliable: reliable,
            email: m.email,
        }
        $http.post(flux.api('api/v0/mark_reliability'), postdata)
            .then(data => {
                resp = data.data;
                console.log(resp);
                _.map(flux.members, _m => {
                    if (_m.email === m.email) {
                        _m.reliable = reliable;
                    }
                });
            }).catch(flux.handleError);
    }

    flux.prevPage = () => {
        flux.page = Math.max(flux.page - 1, 0);
        flux.search();
    }

    flux.nextPage = () => {
        flux.page = Math.min(flux.page + 1, flux.totalPages - 1);
        flux.search();
    }

    ///
    /// MODIFY USERS
    ///


    flux.doModifyUser = (member) => {
        flux.um.user = member;
        flux.modUserGet();
        flux.setTab('modify-user');
    }


    flux.modUserGet = () => {
        const postData = {s: flux.authToken, email: flux.um.user.email};
        console.log('modUserGet requesting: ', postData)

        $http.post(flux.api('api/v0/get_roles_of_user'), postData)
            .then(data => {
                console.log('get_roles_of_user_resp', data);
                const resp = data.data;
                flux.um.roles = resp;
            }).catch(flux.handleError);
    }


    flux.umGiveRole = () => {
        const postdata = {s: flux.authToken, email: flux.um.user.email, role: flux.um.giveRole};
        flux.um.msg = "Adding Role...";

        $http.post(flux.api('api/v0/give_role'), postdata)
            .then(data => {
                flux.modUserGet();
                flux.um.msg = "Added role. " + JSON.stringify(data.data);
            }).catch(flux.handleError);
    }

    flux.umRevokeRoles = () => {
        const postdata = {s: flux.authToken, email: flux.um.user.email};
        flux.um.msg = "Revoking all roles..."

        $http.post(flux.api('api/v0/revoke_all_roles'), postdata)
            .then(data => {
                flux.modUserGet();
                flux.um.msg = JSON.stringify(data.data);
            }).catch(flux.handleError);
    }

    flux.umRenderRoles = () => {
        return JSON.stringify(flux.um.roles, null, 2);
    }


    //
    // Some utils
    //

    var postcodeTest = /[0-9]{4,}/;
    var actPcs = ['2600', '2601', '2602', '2603', '2604', '2605', '2606', '2607', '2608', '2609', '2610', '2611', '2612', '2613', '2614', '2615', '2616', '2617', '2900', '2901', '2902', '2903', '2904', '2905', '2906', '2911', '2912', '2913', '2914'];
    var lookupPcs = {
        '0': 'nt',
        '3': 'vic',
        '5': 'sa',
        '4': 'qld',
        '6': 'wa',
        '7': 'tas',
    };
    flux.getPostcode = function(addr){
        var resp = postcodeTest.exec(addr);
        if (resp)
            return resp[0];
        return null;
    }
    flux.postcodeToState = function(pc){
        if (pc == null)
            return 'unknown';
        var c = pc.charAt(0);
        if (c in lookupPcs)
            return lookupPcs[c];
        if (actPcs.indexOf(pc) != -1)
            return 'act';
        if (c == '2')
            return 'nsw';
        return 'unknown';
    }
    flux.addrToState = function(addr){
        return flux.postcodeToState(flux.getPostcode(addr));
    }

    ///
    // REGO FUNCTIONS
    ///

    flux.partyIdsFromJurisdict = {
        '/AUS': 0,
        '/AUS/ACT': 1,
        '/AUS/WA': 2,
        '/AUS/NSW': 3,
        '/AUS/VIC': 4,
        '/AUS/SA': 5,
        '/AUS/QLD': 6,
        '/AUS/NT': 7,
        '/AUS/TAS': 8,
    }
    flux.juris = _.keys(flux.partyIdsFromJurisdict);

    flux.doRego = function() {
        flux.rego.party_id = flux.partyIdsFromJurisdict[flux.rego.jurisdiction];
        if (flux.rego.jurisdiction === '/AUS') {
            flux.rego.detection_method = 'find_aus_user';
        }
        else {
            flux.rego.detection_method = 'find_state_user';
            flux.rego.state = flux.stateFromJuri(flux.rego.jurisdiction);
        }

        flux.regoResp = "Requesting membership list generation...";
        flux.rego.s = flux.authToken;
        $http.post(flux.api('api/v0/select_members_for_registration'), flux.rego).then(
        (data) => {
            data = data['data'];
            flux.regoResp = data;
        }, flux.handleError);
    }

    flux.doRegoGet = function() {
        flux.regoGet.party_id = flux.partyIdsFromJurisdict[flux.regoGet.jurisdiction];

        flux.regoGetResp = 'Getting member list...'
        flux.regoGet.s = flux.authToken;
        $http.post(flux.api('api/v0/get_party_registration_list'), flux.regoGet).then(
        (data) => {
            data = data['data'];
            flux.regoGetResp = data;
        }, flux.handleError);

    }

    flux.doRegoSend = function({dryRun}) {
        console.log('doRegoSend, dryRun:', dryRun, '; setting to:', dryRun === undefined ? true : dryRun);
        dryRun = dryRun === undefined ? true : dryRun;

        if (!dryRun) {
            const cont = confirm("Warning: This will send the following message to HUNDREDS of members.\n" +
                    "Please make absolutely sure you want to do this.\n\n" +
                    flux.regoSend.msg + "\n\nGood to continue?")
            if (cont === false) return;
        }

        flux.regoSend.s = flux.authToken;

        if (flux.input.regoWarn.memberSelection === 'jurisdiction') {
            flux.regoSend.party_id = flux.partyIdsFromJurisdict[flux.regoSend.jurisdiction];
        } else if (flux.input.regoWarn.memberSelection === 'memberIDs') {
            flux.regoSend.member_ids = flux.input.regoWarn.member_ids
        }

        flux.regoSend.member_selection = flux.input.regoWarn.memberSelection || "none";

        if (!dryRun) {
            flux.regoSendResp = 'Sending...'
        }

        // ensure we check for dryRun
        flux.regoSend.dry_run = dryRun;

        $http.post(flux.api('api/v0/send_msg_notifying_rego_contact'), flux.regoSend).then(
            (data) => {
                data = data['data'];
                flux.regoSendResp = data;
            }, flux.handleError);
    }

    flux.regoMsgCharacters = function() {
        return flux.regoSend.msg.length +
            flux.regoSend.subject.length +
            "Subject: ".length +
            "Thanks, and have a great week,".length +
            "the Flux Membership Robot".length + 2 + 2 + 1  // numbers on end are newlines
    }

    flux.smsPerMember = () => Math.ceil(flux.regoMsgCharacters() / 150);
    flux.smsCostPerMember = () => roundUnsafe(flux.smsPerMember() * 0.05, 2)


    flux.regoSendDescription = () => {
        var msg = "";
        if (flux.input.regoWarn.memberSelection === 'jurisdiction') {
            if (flux.regoSend.send_to_all) {
                if (flux.regoSend.invalid_only) {
                    msg += "all members with invalid deets"
                } else {
                    msg += "all members"
                }
            } else {
                msg += "most recent rego list"
            }
            msg += " in " + flux.regoSend.jurisdiction;
        } else if (flux.input.regoWarn.memberSelection === 'memberIDs') {
            msg += "all members with specified IDs"
        } else {
            msg += "error: please choose a selection method for members"
        }
        return msg
    }


    if (!flux.authToken) {
        flux.errorMsg = "Warning: No authentication details present.";
    } else {
        flux.attemptLogin();
    }


    //
    // call these functions when script loads
    //

//    $window.onload = function(e) {
//        $scope.$digest();
//    }
})
.directive('jurisdictionSelector', () => {
    return {
        scope: {
            ngModel: "="
        },
        templateUrl: 'tmpl/juri-select.html'
    }
})
.directive('btn', () => {
    return {
        scope: {
            onClick: "="
        },
        template: `<button ng-click="onClick" class="bw0 br2 bg-dwyl-teal pa2 white fw1 tc ttu tracked">do what you love</button>`
    }
});
