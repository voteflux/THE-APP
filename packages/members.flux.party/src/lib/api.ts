// all api calls should be written up as methods here (where the methods take the correct arguments)

import { Maybe, Either } from "tsmonad";
import WebRequest from './WebRequest'
import { VueConstructor, Vue } from "vue/types/vue";
import { Http, HttpResponse } from "vue-resource/types/vue_resource";
import { PluginObject } from "vue";
// import io from "socket.io-client";


export interface Paginated {pageN: number, limit: number, total: number}

export interface UserV1Object {
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

export interface Donation {
    name: string;
    street: string;
    city: string;
    state: string;
    postcode: string;
    country: string;
    branch: string;
    ts: number;
    date: string;
    amount: string;
    unit: string;
    email: string;
    payment_source: string;
    id: string;
    extra_data: object | undefined;
}

export interface DonationsResp {donations: Donation[], totalDonations: number, pageN: number, limit: number}

export interface Auth {
  apiToken?: string;
  s: string | undefined;
}

export interface CheckEmailResp {
  doOnboarding: boolean;
}

type R<r> = WebRequest<string, r>;
// promise response
type PR<r> = PromiseLike<R<r>>;

const mkResp = <r>(data): WebRequest<string,r> => {
    if (data.status == 200) {
        if (data.body.error === undefined || data.body.error === '' || data.body.error == false) {
            return WebRequest.Success(data.body);
        } else {
            return WebRequest.Failed(data.body.error);
        }
    } else {
        return WebRequest.Failed(`HTTP request failed with status: ${data.status}`);
    }
};

const mkErr = (path: string) => <r>(err: HttpResponse): WebRequest<string,r> => {
    // console.log('Flux api got error', err);
    return WebRequest.Failed(`Request error at ${path}: ${err.status}`, err)
};


const FluxApi: PluginObject<{}> = {
  install: function(_Vue: VueConstructor, options?: any) {

    const Vue = _Vue as (VueConstructor & {http: Http});

    const http = <Http>(<any>Vue).http;

    const _api2 = (_path: string) => {
      let root;
      if (false /*Vue.$dev*/) {
        root = "https://dev.api.flux.party/";
      } else {
        root = "https://api.flux.party/v2/";
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

    const post = <r>(url: string, data: any): PR<r> => {
      return Vue.http.post(url, data).then(mkResp, mkErr(url)) as PR<r>;
    };

    const get = <r>(url: string): PR<r> => {
      return Vue.http.get(url).then(mkResp, mkErr(url)) as PR<r>;
    };

    Vue.prototype.$flux = {
      v2: {
        checkEmailToOnboard({ email }): PR<any> {
          return post(_api2("user/check_email"), { email });
        },
        getRoles({ s }): PR<{roles: string[]}> {
          return post(_api2("user/getRoles"), { s });
        },
        getDonations({ s }): PR<DonationsResp> {
          return post(_api2('finance/getDonations'), { s })
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
        revokeMembership({ s }): PR<void> {
          return post(_api1("delete_user"), { s });
        }
      },

      utils: {
        captchaImgUrl(session) {
          return _api1("au/captcha_img/" + session);
        },
      },

      auth: {
        loadAuth(): Maybe<Auth> {
          const memberSecret = localStorage.getItem("s") || undefined;
          const apiToken = localStorage.getItem("flux.member.apiToken") || undefined;
          if (memberSecret || apiToken)
            return Maybe.just({ apiToken, s: memberSecret });
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
          this.sendSToAllFluxDomains(secret);
        },

        sendSToAllFluxDomains(s: string) {
          const sendSToUrlAsHashParam = (url, s) => {
            if (s) {
              var ifrm = document.createElement("iframe");
              ifrm.setAttribute("src", url + "#s=" + s);
              ifrm.style.width = "0";
              ifrm.style.height = "0";
              ifrm.style.border = "none";
              document.body.appendChild(ifrm);
            }
          };
          sendSToUrlAsHashParam(
            "https://voteflux.org/_record_login_param.html",
            s
          );
          sendSToUrlAsHashParam(
            "https://flux.party/_record_login_param.html",
            s
          );
        }
      }
    };
  }
};

export default FluxApi;
