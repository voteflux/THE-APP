// all api calls should be written up as methods here (where the methods take the correct arguments)

import { Maybe, Either } from "tsmonad";
// import io from "socket.io-client";

interface UserV1Object {
    fname: string;
    mnames: string;
    sname: string;
    detailsValid: boolean;
    validationReason: string;
    addr_street: string;
    addr_suburb: string;
    addr_postcode: string | number;
    addr_street_no: string;
}

interface Auth {
    apiToken: string;
    s: string;
}

interface CheckEmailResp {
    doOnboarding: boolean;
}

type R<r> = Either<string, r>;

const mkResp = data => {
    if (data.status == 200) {
        if (data.body.error === undefined) {
            return Either.right(data.body);
        } else {
            return Either.left(data.body.error);
        }
    } else {
        return Either.left(`HTTP request failed with status: ${data.status}`);
    }
};

const mkErr = path => err => {
    // console.log('Flux api got error', err);
    return Either.left({ message: `Request error at ${path}: ${err.status}`, err });
};

const FluxApi = {
    install: function(Vue, options) {
        const _api2 = (_path: string) => {
            let root;
            if (Vue.$dev) {
                root = "https://dev.api.flux.party/";
            } else {
                root = "https://api.flux.party/";
            }
            return root + _path;
        };

        const _api1 = (_path: string) => {
            if (_path.indexOf("api/v") === -1) {
                _path = "api/v0/" + _path;
            }

            let root;
            // if (Vue.$dev) {
            //     root = "https://flux-api-dev.herokuapp.com/";
            // } else {
            root = "https://api.voteflux.org/";
            // }
            return root + _path;
        };

        const post = (url, data) => {
            return Vue.http.post(url, data).then(mkResp, mkErr(url));
        };

        const get = url => {
            return Vue.http.get(url).then(mkResp, mkErr(url))
        }

        Vue.prototype.$flux = {
            v2: {
                checkEmailToOnboard({ email }): R<CheckEmailResp> {
                    return post(_api2("user/check_email"), { email });
                },
                getRoles({ s }): R<CheckEmailResp> {
                    return post(_api2("/usr/getRoles"), { s })
                }
            },

            v1: {
                getUserDetails({ s }): R<UserV1Object> {
                    return post(_api1("user_details"), { s });
                },
                saveUserDetails(user): R<UserV1Object> {
                    return post(_api1("user_details"), user);
                },
                sendUserDetails({ email }) {
                    return post(_api1("send_user_details"), { email });
                },
                validationWebsocket() {
                    return new WebSocket(_api1("ws_validation").replace("http", "ws"));
                },
                captchaImgUrl(session) {
                    return _api1("au/captcha_img/" + session);
                },
                getSuburbs(country, postcode) {
                    return get(_api1(`get_suburbs/${country}/${postcode}`))
                },
                getStreets(country, postcode, suburb) {
                    return get(_api1(`get_streets/${country}/${postcode}/${suburb}`))
                },
                revokeMembership({s}): R<void> {
                    return post(_api1("delete_user"), {s})
                }
            },

            auth: {
                loadAuth(): Maybe<Auth> {
                    const memberSecret = localStorage.getItem("s");
                    const apiToken = localStorage.getItem("flux.member.apiToken");
                    if (memberSecret || apiToken) return Maybe.just({ apiToken, s: memberSecret });
                    return Maybe.nothing();
                },

                remove() {
                    localStorage.removeItem("s");
                    localStorage.removeItem("flux.member.apiToken");
                },

                saveApiToken(token: string) {
                    localStorage.setItem("flux.member.apiToken", token);
                },

                saveSecret(secret: string) {
                    localStorage.setItem("s", secret);
                }
            }
        };
    }
};

export default FluxApi;
