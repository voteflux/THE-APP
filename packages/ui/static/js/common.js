var hn = window.location.hostname
var __DEBUG_COMMON__ = hn == 'localhost' || hn == '127.0.0.1'
var __DEV_COMMON__ = hn == "flux-api-dev.herokuapp.com" || hn == "dev.app.flux.party" || __DEBUG_COMMON__


function isDefinitelyProduction() {
    var isProdDomain =
        window.location.hostname === "members.flux.party" ||
        window.location.hostname === "app.flux.party" ||
        window.location.hostname === "admin.flux.party"

    return isProdDomain
}


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


var __DEV_FLAG__ = !getParam('prod') && (getParam('debug') || __DEBUG_COMMON__ || __DEV_COMMON__)

var USE_PROD = getParam('prod') && true


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

function saveFluxSecret(s) {
    localStorage.setItem('s', s);
}

if (getParam('s')) {
    saveFluxSecret(getParam('s'));
}

if (hashParam('s')) {
    saveFluxSecret(hashParam('s'));
}


function sendSToUrlAsHashParam(url, s) {
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


function sendSToAllFluxDomains(s) {
    sendSToUrlAsHashParam("https://voteflux.org/_record_login_param.html", s)
    sendSToUrlAsHashParam("https://flux.party/_record_login_param.html", s)
    sendSToUrlAsHashParam("https://members.flux.party/_record_login_param.html", s)
    sendSToUrlAsHashParam("https://app.flux.party/_record_login_param.html", s)
}


function saveMemberSecretOnFluxDomains(silent, useThisS = null) {
    let doLog = silent === false;
    if (__DEBUG_COMMON__ || __DEV_COMMON__) doLog = true;
    const log = (...args) => { if (doLog) { console.log(...args) }}
    log("saveMemberSecretOnFluxDomains called")
    var s = useThisS ? useThisS : getAuthToken();
    if (s !== undefined) {
        if (isDefinitelyProduction() && localStorage.getItem('lastSavedS') !== s) {
            sendSToAllFluxDomains(s)
            localStorage.setItem('lastSavedS', s);
        } else {
            log("not saving member secret")
        }
    }
}
window.addEventListener("load", saveMemberSecretOnFluxDomains);


function flux_api(path, useDebug){
    // check for api version prefix
    if (path.indexOf('api/v') === -1) {
        path = 'api/v0/' + path;
    }
    if (__DEV_FLAG__ || useDebug){
        return "http://localhost:5000/" + path;
    }
    if(__DEV_COMMON__ && !USE_PROD) {
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
