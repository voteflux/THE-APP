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

    flux.adminSecret = getParam('admin');

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

    flux.beginImport = function(){
        $log.log(flux.import_csv);
        flux.disableImportButton = true;
        flux.msg = 'Beginning Import';

        $http.post(flux.api('import_users'), {'csv': flux.import_csv, 'admin': flux.adminSecret})
            .then(flux.importSuccess, flux.handleError);
    }

    flux.importSuccess = function(data){
        flux.msg = 'Import Success. ' + JSON.stringify(data['data']);
    }

});
