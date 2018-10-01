
var app = angular.module('fluxMembersApp', [])

var mkFluxError, mkFluxMsg

app.controller('FluxController', function($scope, $log, $rootScope, $http, $window){
    //
    // Variables needed
    //

    $rootScope._ = _;

    var flux = this;
    flux.errorMsg = '';
    flux.msg = '';
    flux.msgs = [];
    flux.debug = false;
    flux.valid_regions = [];
    flux.set_password = false;
    flux.showMemberSubmit = true;
    flux.showLoading = true;
    flux.email = '';

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

    flux.toast = msg => {
        if (typeof Toastify !== "undefined" && msg.length > 0) {
            Toastify({
                text: msg,
                duration: 3500,
                gravity: "top",
                positionLeft: false,
                close: true
            }).showToast();
        }
    }

    flux.setMsg = function(msg) {
        flux.msg = msg;
        flux.toast(msg)
    }
    flux.addMsg = msg => {
        flux.msgs.unshift(msg)
        flux.toast(msg)
    }
    mkFluxMsg = flux.addMsg;

    flux.clearMsgs = () => flux.msgs = []

    flux.setErr = function(err) {
        flux.errorMsg = err;
        if (typeof Toastify !== "undefined" && err.length > 0) {
            Toastify({
                text: err,
                duration: 3500,
                gravity: "top",
                positionLeft: false,
                close: true,
                backgroundColor: "linear-gradient(to right, #cc0000, #aa0000)"
            }).showToast();
        }
    }
    mkFluxError = flux.setErr;


    flux.handleError = function(error){
        flux._showError(error);
        $log.log(error);
        flux.showLoading = false;
    };
    flux._showError = function(error){
        flux.clearMsgs();
        console.log('Got error ---V');
        console.log(error);
        var errorMsg;
        if(typeof error === 'object'){
            if (error.status == 403){
                errorMsg = 'Forbidden Error - Are Authentication Details Correct?';
            } else if (error.status === -1) {
                errorMsg = 'Unable to connect to API server.'
            } else {
                if (error.data && error.data.error_args) {
                    errorMsg = JSON.stringify(error.data.error_args);
                } else {
                    errorMsg = JSON.stringify(error);
                }
            }
        } else {
            errorMsg = error;
        }
        flux.setErr(errorMsg);
    };

    // login

    flux.resendEmail = function(){
        flux.addMsg('Sending email...')
        flux.setErr('')
        flux.submitEmail(flux.email)
    }

    flux.submitEmail = function(e){
        console.log('Submitting ' + e);
        $http.post(flux.api('send_user_details'), {email: e}).then(flux.finish, flux.handleError);
    }

    flux.finish = function(data){
        flux.addMsg(data.data['status'])
    }

    flux.batchEmails = function(emails){
        emails.forEach(flux.submitEmail);
    }
    emailsFunction = flux.batchEmails;

    flux.loadingLogin = true;

    flux.checkIfLoggedIn = function(){
        // on page load let's check if the s param is defined and valid. If so redirect to member details page
        if (flux.memberSecret && flux.memberSecret.length > 10) {
            flux.addMsg("I'm checking if you're already logged in...")
            $http.post(flux_api('user_details'), {s: flux.memberSecret})
                .then(function(data) {
                    // this means the details we have are valid
                    saveMemberSecretOnFluxDomains(false, flux.memberSecret)
                    flux.addMsg('Yup, you are! Redirecting in 3 second')
                    if (!getParam('nofwd')) {
                        setTimeout(function(){
                            var memberDeetsPage = "/v"
                            if (location.hostname == "voteflux.org" || location.hostname.indexOf("voteflux.netlify.com") !== -1) {
                                location.href = "https://app.flux.party" + memberDeetsPage
                            } else {
                                window.location.href = memberDeetsPage
                            }
                        }, 3000)
                    }
                }).catch(function(err) {
                    // they weren't valid
                    if (!(__DEV_FLAG__)) {
                        saveMemberSecretOnFluxDomains(false, "");
                        localStorage.removeItem('s')
                    }
                    flux.addMsg("Ahh looks like you're not actually logged in. Sorry for the false alarm.");
                    flux.loadingLogin = false
                })
        } else {
            flux.loadingLogin = false
        }
    }
    flux.checkIfLoggedIn();
});
