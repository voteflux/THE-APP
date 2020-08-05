var _hn = window.location.hostname

function isDefinitelyProduction() {
    return _hn === "members.flux.party" ||
        _hn === "app.flux.party" ||
        _hn === "admin.flux.party" ||
        _hn === "staging.app.flux.party" ||
        _hn === "staging.admin.flux.party"
}

function isStaging() {
    return _hn === "staging.app.flux.party" ||
    _hn === "staging.admin.flux.party"
}


function extractUrlEncodedVar(toSearch, key) {
    var result = undefined,
        tmp = [];
    toSearch
        .substr(1)
        .split("&")
        .forEach(function (item) {
            tmp = item.split("=");
            if (tmp[0] === key) result = decodeURIComponent(tmp[1]);
        });
    return result;
}


// http://stackoverflow.com/questions/5448545/how-to-retrieve-get-parameters-from-javascript
function getParam(key) {
    return extractUrlEncodedVar(location.search, key)
}
function hashParam(key) {
    return extractUrlEncodedVar(location.hash, key)
}

function isEnv(envStr) {
    return getParam("env") === envStr
}


var __DEBUG_DOMAIN__ = _hn === 'localhost' || _hn === '127.0.0.1'
var __DEV_DOMAIN__ = _hn === "dev.v1.api.flux.party" || _hn === "dev.app.flux.party"


var __PROD_ENV__ = (isEnv("prod")) || isDefinitelyProduction()
var __DEV_ENV__ = !isEnv("prod") && (isEnv("dev") || __DEV_DOMAIN__)
var __DEBUG_ENV__ = !isEnv("prod") && (isEnv("debug") || __DEBUG_DOMAIN__)


console.log ({__PROD_ENV__, __DEV_ENV__, __DEBUG_ENV__})


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
    sendSToUrlAsHashParam("https://staging.app.flux.party/_record_login_param.html", s)
    // sendSToUrlAsHashParam("https://admin.flux.party/_record_login_param.html", s)
    // sendSToUrlAsHashParam("https://staging.admin.flux.party/_record_login_param.html", s)
}


function saveMemberSecretOnFluxDomains(silent, useThisS = undefined) {
    let doLog = silent === false;
    if (__DEBUG_DOMAIN__ || __DEV_DOMAIN__) doLog = true;
    const log = (...args) => { if (doLog) { console.log(...args) }}
    log("saveMemberSecretOnFluxDomains called")
    var s = useThisS ? useThisS : getAuthToken();
    if (s !== undefined) {
        if (__PROD_ENV__ && !isStaging()) {
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
    if (__PROD_ENV__ && !useDebug) {
        return "https://prod.v1.api.flux.party/" + path;
    }
    if(__DEV_ENV__ && !useDebug) {
        return "https://dev.v1.api.flux.party/" + path;
    }
    if (__DEBUG_ENV__ || useDebug){
        return "http://" + _hn + ":52100/" + path;
    }
    return "https://prod.v1.api.flux.party/" + path;
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
