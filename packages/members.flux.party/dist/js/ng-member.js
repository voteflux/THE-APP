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
    flux.errorMsg = null;
    flux._currentTab = 'loading';
    flux.page = 0;
    flux.totalPages = 0;
    flux.n_members = 50;
    flux.authToken = getAuthToken();

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
    }

    if (document.location.hostname == 'localhost' || document.location.hostname == '127.0.0.1'){
        flux.debug = true;
    }

    //
    // Functions: api
    //

    flux.api = function(path){
        if (flux.debug){
            return "http://localhost:5000/" + path;
        }
        if(window.location.hostname == "flux-api-dev.herokuapp.com") {
            return "https://flux-api-dev.herokuapp.com/" + path;
        }
        return "https://api.voteflux.org/" + path;
    };

    //
    // functions utils
    //

    flux.handleError = function(error){
        flux._showError(error);
        $log.log(error);
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

    flux.setTab = function(newTab){ flux._currentTab = newTab; }
    flux.isTab = function(tab){ return flux._currentTab == tab; }

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

    flux.doRego = function() {
        flux.rego.party_id = flux.partyIdsFromJurisdict[flux.rego.jurisdiction];
        if (flux.rego.jurisdiction === '/AUS') {
            flux.rego.detection_method = 'find_aus_user';
        }
        else {
            flux.rego.detection_method = 'find_state_user';
            flux.rego.state = flux.rego.jurisdiction.split('/')[2];
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

    flux.doRegoSend = function() {
        const cont = confirm("Warning: This will send the following message to HUNDREDS of members.\n" +
                "Please make absolutely sure you want to do this.\n\n" +
                flux.regoSend.msg + "\n\nGood to continue?")
        if (cont === false) return;
        flux.regoSend.party_id = flux.partyIdsFromJurisdict[flux.regoSend.jurisdiction];
        flux.regoSend.s = flux.authToken;

        flux.regoSendResp = 'Sending...'
        $http.post(flux.api('api/v0/send_msg_notifying_rego_contact'), flux.regoSend).then(
        (data) => {
            data = data['data'];
            flux.regoSendResp = data;
        }, flux.handleError);

    }


    //
    // call these functions when script loads
    //

//    $window.onload = function(e) {
//        $scope.$digest();
//    }
});
