import { FluxApiMethods } from "./api.d";
// all api calls should be written up as methods here (where the methods take the correct arguments)

import * as R from "ramda";
import { Maybe, Either } from "tsmonad";
import { VueConstructor, Vue } from "vue/types/vue";
import { Http, HttpResponse, HttpOptions } from "vue-resource/types/vue_resource";
import { PluginObject } from "vue";
// import io from "socket.io-client";

import { UserV1Object, DonationsResp, RoleResp, Auth, PR, UserForFinance } from "flux-lib/types/db";
import { NdaStatus, NdaDraftCommit, GenerateDraftNdaReq } from "flux-lib/types/db/vols";
import WebRequest from "flux-lib/WebRequest";
import { ER } from "flux-lib/types/index";
import { MsgBus, M } from "../messages";
export * from "flux-lib/types/db";
export * from "flux-lib/types/db/api";
export * from "flux-lib/types/db/vols";

export interface CheckEmailResp {
    doOnboarding: boolean;
}

const mkResp = <r>(data): WebRequest<string, r> => {
    if (data.status == 200) {
        if (data.body.error === undefined || data.body.error === "" || data.body.error == false) {
            return WebRequest.Success(data.body);
        } else {
            return WebRequest.Failed(data.body.error);
        }
    } else {
        return WebRequest.Failed(`HTTP request failed with status: ${data.status}`);
    }
};

const mkErr = (path: string) => <r>(err: HttpResponse): WebRequest<string, r> => {
    // console.log('Flux api got error', err);
    return WebRequest.Failed(`Request error at ${path}: ${err.status}`, err);
};

// todo: check API paths against diff
const localDev = { v2: "http://localhost:52700/v2/", v1: "https://flux-api-dev.herokuapp.com/", prod: false }
const remoteDev = { v2: "https://dev.api.flux.party/v2/", v1: "https://flux-api-dev.herokuapp.com/", prod: false }
const remoteProd = { v2: "https://api.flux.party/v2/", v1: "https://api.voteflux.org/", prod: true }
const apiRoots = () => {
    switch (window.location.hostname) {
        case "127.0.0.1":
        case "localhost":
            return localDev
        case "dev.app.flux.party":
        case "flux-app-dev.netlify.com":
            return remoteDev
        case "app.flux.party":
        case "members.flux.party":
        case "api.voteflux.org":
            return remoteProd
        default:
            if (window.location.hostname.includes("flux-app-dev.netlify.com"))
                return remoteDev
            return remoteProd;
    }
};



export function FluxApi(_Vue: VueConstructor, options?: any): void {
    const Vue = _Vue; //as (VueConstructor & {http: Http});

    const hn = location.host;
    const _isDev = R.any(s => hn.includes(s), ["localhost", "127.0.0.1", ".netlify.com", "ngrok.io", "dev.app.flux.party"]);

    const http = <Http>(<any>Vue).http;

    const roots = apiRoots();

    const _api2 = (_path: string) => {
        return roots.v2 + _path;
    };

    const _api1 = (_path: string) => {
        if (_path.indexOf("api/v") === -1) {
            _path = "api/v0/" + _path;
        }

        return roots.v1 + _path;
    };

    const post = <r>(url: string, data: any, options?: HttpOptions): PR<r> => {
        return http.post(url, data, options).then(mkResp, mkErr(url)) as PR<r>;
    };

    const get = <r>(url: string): PR<r> => {
        return http.get(url).then(mkResp, mkErr(url)) as PR<r>;
    };

    const post_jwt_request = <InTy extends object, OutTy>(apiPath: string, auth: Auth, args: object): PR<OutTy> => {
        return post(_api2(apiPath), args, {headers: { 'Authorization': `Bearer ${''}` }})
    }

    Vue.prototype.$flux = {
        v2: {
            checkEmailToOnboard({ email }): PR<any> {
                return post(_api2("user/check_email"), { email });
            },
            getRoles({ s }): PR<{ roles: string[] }> {
                return post(_api2("user/getRoles"), { s });
            },
            getDonations(args): PR<DonationsResp> {
                return post(_api2("finance/getDonations"), args);
            },
            addNewDonation(args) {
                return post(_api2("finance/addNewDonation"), args);
            },
            donationAutoComplete(opts: Auth & { email: string }): PR<ER<UserForFinance>> {
                return post(_api2("finance/donationAutoComplete"), opts);
            },
            getRoleAudit({ s }): PR<RoleResp[]> {
                return post(_api2("admin/getRoleAudit"), { s });
            },
            getNdaStatus(args): PR<NdaStatus> {
                return post(_api2("volunteers/nda/getStatus"), args);
            },
            submitNdaPdfAndSignature(args: Auth & { pdf: string; sig: string }): PR<NdaStatus> {
                return post(_api2("volunteers/nda/submitPdfAndSig"), args);
            },
            generateDraftPdf: (auth: Auth, args: GenerateDraftNdaReq): PR<NdaDraftCommit> => {
                return post_jwt_request("volunteers/nda/generateDraft", auth, args);
            }
        },

        v1: {
            getUserDetails({ s }): PR<UserV1Object> {
                return post(_api1("user_details"), { s });
            },
            saveUserDetails(user): PR<UserV1Object> {
                return post(_api1("user_details"), user);
            },
            sendUserDetails({ email }) {
                return post(_api1("send_user_details"), { email });
            },
            validationWebsocket(): WebSocket {
                return new WebSocket(_api1("ws_validation").replace("http", "ws"));
            },
            getSuburbs(country, postcode) {
                return get(_api1(`get_suburbs/${country}/${postcode}`));
            },
            getStreets(country, postcode, suburb) {
                return get(_api1(`get_streets/${country}/${postcode}/${suburb}`));
            },
            revokeMembership({ s }): PR<string> {
                return post(_api1("delete_user"), { s });
            }
        },

        utils: {
            captchaImgUrl(session) {
                return _api1("au/captcha_img/" + session);
            },
            onGotUserObj(fullUserDeetsR) {
                fullUserDeetsR.do({
                    failed: e => {
                        throw e;
                    },
                    success: fullUserDeets => {
                        MsgBus.$emit(M.GOT_USER_DETAILS, fullUserDeets);
                    }
                });
            }
        },

        auth: {
            loadAuth(): Maybe<Auth> {
                const memberSecret = localStorage.getItem("s") || undefined;
                const apiToken = localStorage.getItem("flux.member.apiToken") || undefined;
                if (memberSecret || apiToken) return Maybe.just({ apiToken, s: memberSecret });
                return Maybe.nothing();
            },

            remove(): void {
                localStorage.removeItem("s");
                localStorage.removeItem("flux.member.apiToken");
            },

            saveApiToken(token: string): void {
                localStorage.setItem("flux.member.apiToken", token);
            },

            saveSecret(secret: string): void {
                localStorage.setItem("s", secret);
                this.sendSToAllFluxDomains(secret);
            },

            sendSToAllFluxDomains(s: string): void {
                const sendSToUrlAsHashParam = (url, s) => {
                    if (s && roots.prod) {
                        var ifrm = document.createElement("iframe");
                        ifrm.setAttribute("src", url + "#s=" + s);
                        ifrm.style.width = "0";
                        ifrm.style.height = "0";
                        ifrm.style.border = "none";
                        document.body.appendChild(ifrm);
                    }
                };
                sendSToUrlAsHashParam("https://voteflux.org/_record_login_param.html", s);
                sendSToUrlAsHashParam("https://flux.party/_record_login_param.html", s);
            }
        },
        $dev: _isDev
    } as FluxApiMethods;

    return Vue.prototype.$flux;
}

Plugin;

export default FluxApi;
