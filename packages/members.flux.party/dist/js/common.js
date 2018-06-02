var __DEBUG_COMMON__ = window.location.hostname == 'localhost' || window.location.hostname == '127.0.0.1';

var __DEV_COMMON__ = window.location.hostname == "flux-api-dev.herokuapp.com"

// http://stackoverflow.com/questions/5448545/how-to-retrieve-get-parameters-from-javascript
function getParam(val) {
    var result = undefined,
        tmp = [];
    location.search
        //.replace ( "?", "" )
        // this is better, there might be a question mark inside
        .substr(1)
        .split("&")
        .forEach(function (item) {
            tmp = item.split("=");
            if (tmp[0] === val) result = decodeURIComponent(tmp[1]);
        });
    return result;
}

// modified above
function hashParam(val) {
    var result = undefined,
        tmp = [];
    location.hash
        //.replace ( "#", "" )
        // this is better, there might be a hash inside
        .substr(1)
        .split("&")
        .forEach(function (item) {
            tmp = item.split("=");
            if (tmp[0] === val) result = decodeURIComponent(tmp[1]);
        });
    return result;
}

function getAuthToken() {
    var getParamS = getParam('s');
    var lsS = localStorage.getItem('s');
    var hashS = hashParam('s');
    if (lsS) {
        return lsS;
    } else if (getParamS) {
        return getParamS;
    } else if (hashS) {
        return hashS;
    }
    return undefined;
}

if (getParam('s')) {
    localStorage.setItem('s', getParam('s'));
}

if (hashParam('s')) {
    localStorage.setItem('s', hashParam('s'));
}


function saveMemberSecretOnFluxDomains() {
    console.log("saveMemberSecretOnFluxDomains called")
    if (getAuthToken()) {
        var s = getAuthToken();
        function sendSToUrlAsHashParam(url) {
            console.log("Sending S to localstorage at", url)
            if (s) {
                var ifrm = document.createElement("iframe")
                ifrm.setAttribute('src', url + "#s=" + s)
                ifrm.style.width = '0';
                ifrm.style.height = '0';
                ifrm.style.border = 'none';
                document.body.appendChild(ifrm);
            }
        }
        if (!__DEBUG_COMMON__ && !__DEV_COMMON__ && localStorage.getItem('lastSavedS') !== s) {
            sendSToUrlAsHashParam("https://voteflux.org/_record_login_param.html")
            sendSToUrlAsHashParam("https://flux.party/_record_login_param.html")
            sendSToUrlAsHashParam("https://members.flux.party/_record_login_param.html")
            localStorage.setItem('lastSavedS', s);
        }
    }
}
window.addEventListener("load", saveMemberSecretOnFluxDomains);


function flux_api(path, useDebug){
    // check for api version prefix
    if (path.indexOf('api/v') === -1) {
        path = 'api/v0/' + path;
    }
    if (!getParam('prod') && (getParam('debug') || __DEBUG_COMMON__ || useDebug)){
        return "http://localhost:5000/" + path;
    }
    if(__DEV_COMMON__ && !getParam('prod')) {
        return "http://flux-api-dev.herokuapp.com/" + path;
    }
    return "https://api.voteflux.org/" + path;
};


function handle_output_model_decorator(host_obj, field_name){
    var r = function(data){
        host_obj[field_name] = JSON.stringify(data);
        console.log('Got some data!', data);
    }
    return r;
}

function jsonDumps(obj){
    return JSON.stringify(obj);
}

function roundUnsafe(value, decimals) {
  return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
}
