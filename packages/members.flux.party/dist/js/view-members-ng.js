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

    flux.detailsValid = false;
    flux.needsValidating = true;

    flux.doubleChecking = getParam('doubleCheck') == 'true';
    flux.adminSecret = getParam('s');
    flux.memberSecret = '';

    flux.toRender = [];
    flux.nRecords = 0;
    flux.filterVolunteers = 'all';
    flux.filterState = 'all';
    flux.filterHTVs = 'all';
    flux.filterSuperVols = 'all';
    flux.filterName = '';
    flux.renderLimit = 500;
    flux.fUpdatingRender = false;

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

    flux.gotAllMembers = function(data){
        data = data['data'];
        flux.allMembers = data;
        flux.showLoading = false;
        flux.updateRender();

        console.log('all the members');
        console.log(data);
    }
    flux.getAllMembers = function(){
        $http.post(flux.api('all_members'), {s: flux.adminSecret}).then(flux.gotAllMembers, flux.handleError);
    }
    flux.getAllMembers();


    flux.updateRender = function(){
        flux.fUpdatingRender = true;
        setTimeout(function(){ flux._updateRender(); $scope.$apply(); }, 10);
    }
    flux._updateRender = function(){
        var toRender = flux.allMembers;

        // name filter, do first because there's just so much more data
        if (flux.filterName != ''){
            toRender = _.filter(toRender, function(o){
                return ( o.name.toLowerCase().indexOf(flux.filterName.toLowerCase()) !== -1 )
            })
        }

        // vol filter
        if (flux.filterVolunteers != 'all'){
            toRender = _.filter(toRender, function(o){
                if (!('volunteer' in o)){ o.volunteer = false; }
                return (('volunteer' in o) && (o.volunteer == (flux.filterVolunteers == 'yes')));
            });
        }

        //state filter
        if (flux.filterState != 'all'){
            toRender = _.filter(toRender, function(o){
                var _state = flux.addrToState(o.address);
                return (_state == flux.filterState);
            });
        }

        //supervol filter
        if (flux.filterSuperVols != 'all'){
            toRender = _.filter(toRender, function(o){
                return ( flux.filterSuperVols == 'yes' ? o.supervol : !o.supervol );
            });
        }

        //htv filter
        if (flux.filterHTVs != 'all'){
            toRender = _.filter(toRender, function(o){
                return ( flux.filterHTVs == 'yes' ? o.volhtv : !o.volhtv );
            });
        }

        flux.toRender = toRender;

        flux.csvOutput = "";
        _.forEach(flux.toRender, function(o){
            flux.csvOutput += '"' + _.join([o.name, o.timestamp, o.email, o.contact_number, o.address , o.volunteer == true, o.dobDay + '/' + o.dobMonth + '/' + o.dobYear] , '","') + '"\n';
        })
        console.log("CSV Length: " + flux.csvOutput.length);
        flux.nRecords = flux.toRender.length;
        flux.fUpdatingRender = false;
    }

    flux.saveCSV = function(){
        $log.log('saveCSV triggered');
        saveAs(new Blob([flux.csvOutput], {type: "text/csv"}), 'members-filtered-' + (Date.now().toString()));
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


    //
    // call these functions when script loads
    //

//    $window.onload = function(e) {
//        $scope.$digest();
//    }
});
