var app = angular.module('fluxImportApp', []);

app.controller('FluxController', function($scope, $log, $rootScope, $http, $window){
    //
    // Variables needed
    //

    $rootScope._ = _;

    var flux = this;
    flux.errorMsg = '';
    flux.debug = false;
    flux.import_csv = '';
    flux.disableImportButton = false;
    flux.msg = '';

    flux.emailValidMembersButtonLocked = true;
    flux.emailInvalidMembersButtonLocked = true;
    flux.emailBadDobButtonLocked = true;
    flux.clickedUnlockValid = false;
    flux.clickedUnlockInvalid = false;
    flux.clickedUnlockBadDob = false;

    flux.adminSecret = getParam('s');

    if (document.location.hostname == 'localhost'){
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
            return "http://flux-api-dev.herokuapp.com/" + path;
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
    };
    flux._showError = function(error){
        if(typeof error === 'object'){
            if (error.status){
                if(error.status == 403){
                    flux.errorMsg = 'Forbidden Error - Are Authentication Details Correct?'
                } else {
                    flux.errorMsg = JSON.stringify(error);
                }
            } else {
                flux.errorMsg = JSON.stringify(error);
            }
        } else {
            flux.errorMsg = error;
        }
    };

    var user_fields = ['username', 'email', 'name', 'address', 'valid_regions', 'dob', 'contact_number', 'member_comment', 'referred_by', 'onAECRoll', 'dobDay', 'dobMonth', 'dobYear'];

    flux.unlockEmailValid = function(){
        flux.emailValidMembersButtonLocked = false;
        flux.clickedUnlockValid = true;
    }

    flux.unlockEmailInvalid = function(){
        flux.emailInvalidMembersButtonLocked = false;
        flux.clickedUnlockInvalid = true;
    }

    flux.unlockEmailBadDob = function(){
        flux.emailBadDobButtonLocked = false;
        flux.clickedUnlockBadDob = true;
    }

    flux.emailValid = function(){
        flux.emailValidMembersButtonLocked = true;
        flux._sendEmailCommand({emailValidUsers: true});
    }

    flux.emailInvalid = function(){
        flux.emailInvalidMembersButtonLocked = true;
        flux._sendEmailCommand({emailInvalidUsers: true});
    }

    flux.emailBadDob = function(){
        flux.emailBadDobButtonLocked = true;
        flux._sendEmailCommand({emailBadDob: true});
    }

    flux._sendEmailCommand = function(to_send){
        flux.msg = 'Beginning Send';
        $log.log('Sending ' + JSON.stringify(to_send));

        to_send['s'] = flux.adminSecret;

        $http.post(flux.api('admin_email_reminders'), to_send)
            .then(flux.importSuccess, flux.handleError);
    }

    flux.importSuccess = function(data){
        flux.msg = 'Send Success. ' + JSON.stringify(data['data']);
    }

});
