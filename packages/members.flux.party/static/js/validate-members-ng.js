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
    flux.fOldAddr = true;

    flux.detailsValid = false;
    flux.needsValidating = true;

    flux.doubleChecking = getParam('doubleCheck') == 'true';
    flux.adminSecret = getAuthToken();
    flux.memberSecret = '';
    flux.state = getParam('state');

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

    // login

    flux.login = function(data){
        var user = data['data'];
        $log.log(data);

        if (user === null || user === undefined || user === 'null'){
            flux.handleError('Did not receive a user.');
            return
        }

        $log.log(user);
        flux.user = user;
        flux.name = user.name;
        flux.address = user.address;
        flux.email = user.email;
        flux.onAECRoll_raw = user.onAECRoll ? "Yes" : "No";
        flux.dobDay = user.dobDay.toString();
        flux.dobMonth = user.dobMonth.toString();
        flux.dobYear = user.dobYear.toString();
        flux.referred_by = user.referred_by;
        flux.member_comment = user.member_comment;
        flux.contact_number = user.contact_number;
        flux.detailsValid = user.detailsValid;
        flux.needsValidating = user.needsValidating;
        flux.memberSecret = user.s;

        flux.showLoading = false;

        flux.fOldAddr = flux.user.addr_street_no === undefined;
        flux.fOldName = flux.user.fname === undefined;

        if (flux.fOldName) {
            var name_arr = flux.name.split(' ');
            flux.fname = (_.slice(name_arr, 0, name_arr.length - 1)).join(' ');
            flux.sname = name_arr[name_arr.length - 1];
        } else {
            flux.fname = flux.user.fname + " " + (flux.user.mnames || "");
            flux.sname = flux.user.sname;
        }

        if (flux.fOldAddr) {

        }

        $log.log(user);
    }

    flux.getUser = function(secret, memberSecret){
        var params;
        if (memberSecret === undefined){
            params = {'s': secret};
            if (flux.state != undefined){
                params['state'] = flux.state;
                console.log(flux.state);
            }
        } else {
            params = {'s': secret, 'memberSecret': memberSecret};
        }
        if (flux.doubleChecking){
            params['doubleCheck'] = true;
        }
        $http.post(flux.api('validate_user_details'), params)
            .then(flux.login, flux.handleError);
    }
    flux.getUser(flux.adminSecret);

    flux._reportMember = function(valid_bool, fed, state){
        flux.showMemberSubmit = false;
        flux.detailsValid = valid_bool;
        var to_send = {'s': flux.adminSecret, 'valid': valid_bool, 'user_s': flux.memberSecret};
        if (fed != undefined && state != undefined){
            to_send['valid_federal'] = fed;
            to_send['valid_state'] = state;
        } else {
            to_send['valid_federal'] = valid_bool;
            to_send['valid_state'] = valid_bool;
        }
        if (flux.doubleChecking){
            to_send['doubleCheck'] = true;
        }
        $http.post(flux.api('report_validation'), to_send)
            .then(flux.finishSaving, flux.handleError);
    };
    flux.reportMemberValid = function(){
        flux._reportMember(true);
    }
    flux.reportMemberValidFederal = function(){
        flux._reportMember(true, true, false);
    }
    flux.reportMemberValidState = function(){
        flux._reportMember(true, false, true);
    }
    flux.reportMemberInvalid = function(){
        flux._reportMember(false);
    }

    flux.logOut = function(){
        flux.loggedIn = false;
        flux.userId = undefined;
        flux.user = undefined;
        flux.username = undefined;
        flux.finishedLoggingIn();
    };

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
        $log.log("Setting " + property + " with value " + flux[property] + " on " + obj);
        obj[property] = flux[property];
    }

    var user_fields = ['username', 'email', 'name', 'address', 'valid_regions', 'dob', 'contact_number', 'member_comment', 'referred_by', 'onAECRoll', 'dobDay', 'dobMonth', 'dobYear'];


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
        $log.log(flux.dob);
        if (flux.onAECRoll != 'Yes') // if we are marked as not being on the roll don't include AUS as a region
            _.remove(flux.valid_regions, function (t) {
                return t == 'AUS'
            });
        else if (!_.includes(flux.valid_regions, 'AUS')) // if we are on the roll and don't have 'AUS' in our list, add it
            flux.valid_regions.push('AUS');
        $log.log(flux.valid_regions);
        flux.username = flux.email;
        flux.onAECRoll = flux.onAECRoll_raw === "Yes" ? true : false;

        user_deets = {};
        _.map(user_fields, _.partial(flux._setObjPropFromFlux, user_deets));
        user_deets['s'] = flux.memberSecret;

        $http.post(flux.api('user_details'), user_deets)
            .then(flux.finishSaving, flux.handleError);
    };

    flux.finishSaving = function(data){
        flux.showMemberSubmit = true;
        flux.showMsg = true;
        flux.msg = "Saved successfully! Details Valid? " + flux.detailsValid.toString();
    };

    flux.nextMember = function(){
        location.reload();
    }

    //
    // call these functions when script loads
    //

//    $window.onload = function(e) {
//        $scope.$digest();
//    }
});
