import sha256 from 'fast-sha256';
import { FluxApiMethods } from "./api.d";
// all api calls should be written up as methods here (where the methods take the correct arguments)

import * as R from "ramda";
import { Option, some, none, isSome, isNone } from 'fp-ts/lib/Option'
import { VueConstructor, Vue } from "vue/types/vue";
import { Http, HttpResponse, HttpOptions } from "vue-resource/types/vue_resource";
import { PluginObject } from "vue";
// import io from "socket.io-client";

import {
    UserV1Object,
    DonationsResp,
    RoleResp,
    Auth,
    PR,
    UserForFinance,
    RolesResp,
    Req,
    AuthJWT,
    Paginated
} from "flux-lib/types/db";
import { NdaStatus, NdaDraftCommit, GenerateDraftNdaReq } from "flux-lib/types/db/vols";
import WebRequest from "flux-lib/WebRequest";
import { StdSimpleEitherResp } from "flux-lib/types/index";
import { MsgBus, M } from "../messages";
import { createSignedReq, PayloadDecoder, objToPayload } from 'flux-lib/types/db/auth'
import { SignedReqCreationOpts, Payload } from '../../../lib/types/db/auth'
import { SimpleEither } from '../../../lib/types/index'
import {QandaQuestion} from "flux-lib/types/db/qanda";
import {store} from "@/store";
import {cons} from "fp-ts/lib/Array";
export * from "flux-lib/types/db";
export * from "flux-lib/types/db/api";
export * from "flux-lib/types/db/vols";

export interface CheckEmailResp {
    doOnboarding: boolean;
}

const mkResp = <r>(data): WebRequest<string, r> => {
    if (data.status == 200) {
        console.log(data)
        if (data.body && data.body !== null && data.body.error === undefined) {
            return WebRequest.Success(data.body);
        } else {
            if (data.body && data.body.error) {
                return WebRequest.Failed(data.body.error);
            }
            return WebRequest.Failed("No response from API")
        }
    } else {
        console.error('http req failed:', data);
        return WebRequest.Failed(`HTTP request failed with status: ${data.status}`);
    }
};

const mkErr = (path: string) => <r>(err: HttpResponse): WebRequest<string, r> => {
    console.error('Flux api got error', err);
    return WebRequest.Failed(`Request error at ${path}: ${err.status}`, err);
};

// todo: check API paths against diff
// "https://w184hkom33.execute-api.ap-southeast-2.amazonaws.com/Prod/"
// "https://api.sam-flux-dev.fish.xk.io/"
// v1: "https://dev.v1.api.flux.party/",
const localDev = { v3: "http://127.0.0.1:52701/", v2: "http://127.0.0.1:52700/v2/", v1: "http://127.0.0.1:52600/", prod: false }
const localPartialDev = { v3: "http://127.0.0.1:52701/", v2: "http://127.0.0.1:52700/v2/", v1: "https://dev.v1.api.flux.party/", prod: false }
const remoteDev = { v3: "https://api.dev.sam.flux.party/", v2: "https://dev.api.flux.party/v2/", v1: "https://dev.v1.api.flux.party/", prod: false }
const remoteStaging = { v3: "https://api.dev.sam.flux.party/", v2: "https://dev.api.flux.party/v2/", v1: "https://staging.v1.api.flux.party/", prod: false }
const remoteProd = { v3: "https://api.sam.flux.party/", v2: "https://api.flux.party/v2/", v1: "https://prod.v1.api.flux.party/", prod: true }

const endpoints = {
    'localPartial': localPartialDev,
    'local': localDev,
    'dev': remoteDev,
    'staging': remoteStaging,
    'prod': remoteProd
}

const apiRoots = () => {
    const getDefaults = () => {
        if (window.location.search.includes('env=localPartial')) {
            return endpoints.localPartial
        }

        switch (window.location.hostname) {
            case "127.0.0.1":
            case "localhost":
                return endpoints.local;
            case "dev.app.flux.party":
            case "flux-app-dev.netlify.com":
                return endpoints.dev;
            case "staging.app.flux.party":
            case "flux-app-staging.netlify.com":
                return endpoints.staging;
            case "app.flux.party":
            case "members.flux.party":
            case "prod.v1.api.flux.party":
            case "flux-app.netlify.com":
                return endpoints.prod;
            default:
                if (window.location.hostname.includes("flux-app-dev.netlify.com"))
                    return endpoints.dev;
                return endpoints.prod;
        }
    }
    const roots = getDefaults()
    return {
        v3: localStorage.getItem('flux-api-override-endpoint-v3') || roots.v3,
        v2: localStorage.getItem('flux-api-override-endpoint-v2') || roots.v2,
        v1: localStorage.getItem('flux-api-override-endpoint-v1') || roots.v1,
        prod: roots.prod
    }
};


const mkSignedRequest = (path: string, payload: Payload, auth: AuthJWT, aux?: Payload) => {
    return createSignedReq({ path, payload, aux }, auth.sk)
}


const onGotUserObj = (fullUserDeetsR: Req<UserV1Object>): Req<UserV1Object> => {
    fullUserDeetsR.do({
        failed: e => {
        },
        success: fullUserDeets => {
            MsgBus.$emit(M.GOT_USER_DETAILS, fullUserDeets);
        }
    });
    return fullUserDeetsR
}


// transforms on data from API
const tform = {
    qandaQResp: (wr) => {
        return wr.mapSuccess((resp) => {
            resp.questions.map(q => q.ts = new Date(q.ts));
            return resp
        });
    },
    mapTs: (field) => (wr) => {
        return wr.mapSuccess(resp => {
            resp[field].ts = new Date(resp[field].ts)
            return resp
        })
    }
}



export function FluxApi(_Vue: VueConstructor, options?: any): void {
    const Vue = _Vue; //as (VueConstructor & {http: Http});

    const hn = location.host;
    const _isDev = R.any(s => hn.includes(s), ["localhost", "127.0.0.1", ".netlify.com", "ngrok.io", "dev.app.flux.party"]);

    const http = <Http>(<any>Vue).http;

    let roots = apiRoots();

    const _api3 = (_path: string) => {
        return roots.v3 + _path;
    };

    const _api2 = (_path: string) => {
        return roots.v2 + _path;
    };

    const _api1 = (_path: string) => {
        if (_path.indexOf("api/v") === -1) {
            _path = "api/v0/" + _path;
        }

        return roots.v1 + _path;
    };

    const post = <R>(url: string, data: any, options = {headers: {}} as HttpOptions): PR<R> => {
    const _opts: HttpOptions = {...options}
        _opts.headers = {"content-type": "application/json", ...(options.headers || {})}
        return http.post(url, data, _opts).then(mkResp, mkErr(url)) as PR<R>;
    };

    const get = <r>(url: string): PR<r> => {
        return http.get(url).then(mkResp, mkErr(url)) as PR<r>;
    };

    // used for profiles since 2019-02-20 ish
    const getWAuth = <r>(url: string): PR<r> => {
        return http.get(url, {headers: {Authorization: `Bearer ${store.state.app.jwt_token}`}}).then(mkResp, mkErr(url)) as PR<r>;
    };

    const patchWAuth = <r>(url: string, doc: object): PR<r> => {
        return http.patch(url, doc, {headers: {Authorization: `Bearer ${store.state.app.jwt_token}`}}).then(mkResp, mkErr(url)) as PR<r>;
    }

    const post_jwt = <InTy extends object, OutTy>(apiPath: string, auth: AuthJWT, args: object): PR<OutTy> => {
        const payload = objToPayload(args)
        const body = mkSignedRequest(apiPath, payload, auth)
        return post(_api2(apiPath), body, {headers: { 'Authorization': `Bearer ${auth.jwt}` }})
    }

    const fluxMethods = {
        v3: {
            qanda: {
                getMine: (args) =>
                    post(_api3("qanda/getMine"), args).then(tform.qandaQResp),
                getAll: () =>
                    get(_api3("qanda/get")).then(tform.qandaQResp),
                getQuestion: (rid) =>
                    get(_api3(`qanda/question/${rid}`)).then(tform.mapTs('question')),
                submit: (args) =>
                    post(_api3("qanda/submit"), args).then(tform.mapTs('question')),
                submitReply: (args) =>
                    post(_api3("qanda/submitReply"), args).then(tform.mapTs('reply')),
                getReplyIds: (qid) =>
                    get(_api3(`qanda/replyIds/${qid}`)),
                getReply: (rid) =>
                    get(_api3(`qanda/reply/${rid}`)).then(tform.mapTs('reply')),
            },
        },

        v2: {
            checkEmailToOnboard({ email }): PR<any> {
                return post(_api2("user/check_email"), { email });
            },
            getRoles({ s }): PR<RolesResp> {
                return post(_api2("user/getRoles"), { s });
            },
            getDonations(args): PR<DonationsResp> {
                return post(_api2("finance/getDonations"), args);
            },
            getDonationArchive({ s }): PR<any> {
                return post(_api2("finance/getDonationArchive"), { s }, {responseType: 'blob'})
                    .then(r => {
                        const url = window.URL.createObjectURL(new Blob([r.data]));
                        const link = document.createElement('a');
                        link.href = url;
                        link.setAttribute('download', `flux-donation-archive-${Date.now()/1000|0}.zip`);
                        document.body.appendChild(link);
                        link.click();
                    })
            },
            addNewDonation(args) {
                return post(_api2("finance/addNewDonation"), args);
            },
            donationAutoComplete(opts: Auth & { email: string }): PR<StdSimpleEitherResp<UserForFinance>> {
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
            ndaGenerateDraftPdf: (auth: Auth, args: GenerateDraftNdaReq): PR<NdaDraftCommit> => {
                return post(_api2("volunteers/nda/generateDraft"), {...auth, ...args});
            },
            ndaFinalizeSubmission: (auth: Auth, args: {signatureImage: string, pdfHash: string, sigHash: string}) =>
                post(_api2("volunteers/nda/finalizeSubmission"), {...auth, ...args}),
            login: {
                getJWTNoPermissions: (): PR<{jwt: string}> => {
                    return post(_api2("login/getJWTNoPermissions"), {})
                },
                requestLoginToken: (auth: AuthJWT, args: {email: string}): PR<SimpleEither<string, any>> => {
                    return post_jwt("login/requestLoginToken", auth, args)
                }
            },
        },

        v1: {
            getUserDetails({ s }): PR<UserV1Object> {
                return (post(_api1("user_details"), { s }) as PR<UserV1Object>).then(onGotUserObj)
            },
            saveUserDetails(user): PR<UserV1Object> {
                return (post(_api1("user_details"), user) as PR<UserV1Object>).then(onGotUserObj);
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

        profiles: {
            getFields(profile_type): PR<any> {
                return (get(_api1(`api/v1/profile_fields/${profile_type}`)))
            },
            getMyProfile(profile_type): PR<any> {
                return (getWAuth(_api1(`api/v1/profile/${profile_type}`)))
            },
            patchMyProfile(profile_type, patchDoc): PR<any> {
                console.log(profile_type, patchDoc)
                return (patchWAuth(_api1(`api/v1/profile/${profile_type}`), patchDoc))
            }
        },

        utils: {
            captchaImgUrl(session) {
                return _api1("au/captcha_img/" + session);
            },
            onGotUserObj
        },

        auth: {
            loadAuth(): Option<Auth> {
                const memberSecret = localStorage.getItem("s") || undefined;
                const apiToken = localStorage.getItem("flux.member.apiToken") || undefined;
                if (memberSecret || apiToken) {
                    return some({ apiToken, s: memberSecret });
                }
                return none;
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

        jwt: {
            jwt_basic_post(o: Auth): PR<{token: string}> {
                return post(_api1("api/v1/jwt_basic"), o)
            }
        },

        $dev: _isDev,
        setEndpoints(stage) {
            roots = endpoints[stage] || roots;
        }
    } as FluxApiMethods;

    Vue.prototype.$flux = fluxMethods

    return Vue.prototype.$flux;
}


export default FluxApi;
export type FluxApiMethods = FluxApiMethods;
