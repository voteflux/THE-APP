
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


    flux.setMsg = function(msg) {
        flux.msg = msg;
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
    mkFluxMsg = flux.setMsg;

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
        flux.setMsg('');
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
        flux.setMsg('Sending email...')
        flux.setErr('')
        flux.submitEmail(flux.email)
    }

    flux.submitEmail = function(e){
        console.log('Submitting ' + e);
        $http.post(flux.api('send_user_details'), {email: e}).then(flux.finish, flux.handleError);
    }

    flux.finish = function(data){
        flux.setMsg(data.data['status'])
    }

    flux.batchEmails = function(emails){
        emails.forEach(flux.submitEmail);
    }
    emailsFunction = flux.batchEmails;

    flux.checkIfLoggedIn = function(){
        // on page load let's check if the s param is defined and valid. If so redirect to member details page
        if (flux.memberSecret && flux.memberSecret.length > 17) {
            flux.setMsg("I'm checking if you're already logged in...")
            $http.post(flux_api('user_details'), {s: flux.memberSecret})
                .then(function(data) {
                    // this means the details we have are valid
                    flux.setMsg('Yup, you are! Redirecting in 3 second')
                    if (!getParam('nofwd')) {
                        setTimeout(function(){
                            var memberDeetsPage = "/v"
                            if (location.hostname == "voteflux.org" || location.hostname.indexOf("voteflux.netlify.com") !== -1) {
                                // we might not have the `s` param on api.voteflux.org, so let's add it
                                location.href = "https://api.voteflux.org" + memberDeetsPage + "#s=" + flux.memberSecret
                            } else {
                                window.location.href = memberDeetsPage
                            }
                        }, 3000)
                    }
                }).catch(function(err) {
                    // they weren't valid
                    if (!(__DEV_FLAG__)) {
                        sendSToAllFluxDomains("");
                        localStorage.removeItem('s')
                    }
                    flux.setMsg("Ahh looks like you're not actually logged in. Sorry for the false alarm.");
                    flux.setMsg('');
                })
        }
    }
    flux.checkIfLoggedIn();
});
