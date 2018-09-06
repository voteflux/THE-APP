var app = angular.module('fluxMembersApp', []);

app.controller('FluxController', function($scope, $log, $rootScope, $http, $window){
    //
    // Variables needed
    //

    $rootScope._ = _;

    var flux = this;
    flux.errorMsg = '';
    flux.debug = false;
    flux.valid_regions = [];
    flux.set_password = false;
    flux.showMemberSubmit = true;
    flux.showLoading = true;
    flux.showLoggedOut = false;
    flux.loading = {};

    flux.detailsValid = false;
    flux.needsValidating = true;

    flux.memberSecret = getAuthToken();

    if (document.location.hostname == 'localhost'){
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
        $log.log(error);
        flux.showLoading = false;
    };
    flux.handleErrorAndThen = function(cb) {
        return function(error) {
            flux.handleError(error);
            cb(error);
        }
    }
    flux._showError = function(error){
        if(typeof error === 'object'){
            if(error.status == 403){
                flux.errorMsg = 'Forbidden Error - Are Authentication Details Correct?'
            } else {
                flux.errorMsg = JSON.stringify(error);
            }
        } else {
            flux.errorMsg = error;
        }
    };

    var user_fields = ['username', 'email', 'name', 'fname', 'mnames', 'sname', 'address', 'valid_regions', 'dob',
    'contact_number', 'member_comment', 'referred_by', 'onAECRoll', 'dobDay', 'dobMonth', 'dobYear', 'volunteer',
    'supervol', 'volhtv', 'state_consent', 'candidature_federal', 'candidature_state', 'candidature_local', 'addr_postcode',
    'addr_country', 'addr_suburb', 'addr_street', 'addr_street_no', 'smsOptOut'];

    // login

    flux.login = function(data){
        var user = data['data']
        $log.log(user);

        // set most details automatically
        _.map(user_fields, function(_uf){ flux[_uf] = user[_uf]; console.log('Set flux.' + _uf + ' to ' + user[_uf])});

        // set other details that need manual stuff
        flux.onAECRoll_raw = user.onAECRoll ? "Yes" : "No";
        flux.dobDay = user.dobDay.toString();
        flux.dobMonth = user.dobMonth.toString();
        flux.dobYear = user.dobYear.toString();
        flux.addr_country = flux.addr_country || 'au';

        flux.showLoading = false;

        flux.updateUI();
        flux.genQR();
    }

    flux.genQR = function(){
        try {
            flux.qrCode = new QRCode(document.getElementById("app-login-qr"), flux.memberSecret);
        } catch (e) {
            console.log('failed to draw qr code')
        }
    }

    flux.onFailedLogin = function() {
        localStorage.removeItem('s')
        flux.showLoggedOut = true;
    }

    flux.getUser = function(secret){
        $http.post(flux.api('user_details'), {'s': secret})
            .then(flux.login, flux.handleErrorAndThen(flux.onFailedLogin));
    }
    if (flux.memberSecret) {
        flux.getUser(flux.memberSecret);
    } else {
        flux.showLoading = false;
        flux.showLoggedOut = true;
    }

    flux.logout = function(){
        flux.loggedIn = false;
        flux.userId = undefined;
        flux.user = undefined;
        flux.username = undefined;
        localStorage.removeItem('s');
        flux.showLoggedOut = true;

        var slen = location.search.length
        var hlen = location.hash.length
        var tlen = location.href.length
        var newLocation = location.href.substr(0, tlen - hlen - slen)

        location.href = newLocation;
    };

    flux.deletedUser = function(data){
        $log.log('deleted user');
        flux.msg = 'Deleted User';
        flux.showMsg = true;
    }

    flux.deleteUser = function(){
        var shouldDel = confirm("Remove self from Flux membership list?\nCancel for No, Okay to confirm.");
        if (shouldDel){
            $http.post(flux.api('delete_user'), {s: flux.memberSecret}).then(flux.deletedUser, flux.handleError);
        }
    }

    //
    // Update UI with resources
    //

    flux.postcodeRegex = /\d\d\d\d/;
    flux.testPC = function() { return flux.postcodeRegex.test(flux.addr_postcode); }
    flux.updatePostcode = function(){
        if(flux.postcodeRegex.test(flux.addr_postcode)){
            flux.loading['suburbs'] = true;
            flux.suburbError = '';
            $http.get(flux_api('get_suburbs/au/' + flux.addr_postcode)).then(
                function(data){
                    flux.loading['suburbs'] = false;
                    flux.suburbs = data.data.suburbs;
                    if (!_.includes(flux.suburbs, flux.addr_suburb))
                        flux.addr_suburb = null;;
                    flux.suburbError = null;
                }, function(err){
                    console.log(err);
                    flux.loading['suburbs'] = false;
                    flux.suburbError = err.statusText;
                    flux.handleError(err);
                });
        }
    }

    flux.updateSuburb = function(){
        flux.loading['streets'] = true;
        $http.get(flux_api('get_streets/au/' + flux.addr_postcode + "/" + flux.addr_suburb)).then(
            function(data){
                flux.loading['streets'] = false;
                flux.streets = data.data.streets;
                flux.streetError = null;
                if (!_.includes(flux.streets, flux.addr_street))
                    flux.addr_street = null;
            }, function(err){
                console.log(err);
                flux.loading['streets'] = false;
                flux.streetError = err.statusText;
                flux.handleError(err);
            }
        )
    }

    flux.updateUI = function(){
        flux.updatePostcode();
        flux.updateSuburb();
    }

    //
    // functions object management
    //

    flux._setProperty = function(property, value){
        $log.log('Setting flux.' + property + ' as ' + value);
        flux[property] = value;
    };
    flux._setPropertyFromParseObj = function(obj, property){
        flux._setProperty(property, obj.get(property));
    };
    flux._setPropertiesFromParseObj = function(obj, properties){
        _propSet = function(_property){ flux._setPropertyFromParseObj(obj, _property); };
        properties.map(_propSet);
    };

    flux._setObjPropFromFlux = function(obj, property){
        $log.log("Setting " + property + " with value " + flux[property]);
        obj[property] = flux[property];
    }


    //
    // functions user management
    //

    flux.saveUserDetails = function() {
        flux.showMemberSubmit = false;
        flux.showMsg = false;
        flux.needsValidating = true;

        flux.dob = new Date();
        flux.dob.setUTCDate(flux.dobDay);
        flux.dob.setUTCFullYear(flux.dobYear);
        flux.dob.setUTCMonth(flux.dobMonth - 1);
        flux.dob.setUTCHours(0);

        flux.name = _.join([flux.fname, flux.mnames, flux.sname], " ");
        flux.address = _.join([flux.addr_street_no, flux.addr_street, flux.addr_suburb, flux.addr_postcode], "; ");

        $log.log(flux.dob);
        $log.log(flux.valid_regions);
        flux.username = flux.email;
        flux.onAECRoll = flux.onAECRoll_raw === "Yes";

        user_deets = {};
        _.map(user_fields, _.partial(flux._setObjPropFromFlux, user_deets));
        user_deets['s'] = flux.memberSecret;

        $http.post(flux.api('user_details'), user_deets)
            .then(flux.finishSaving, flux.handleError);
    };

    flux.finishSaving = function(data){
        flux.showMemberSubmit = true;
        flux.showMsg = true;
        flux.msg = "Saved successfully!";
    };

});
