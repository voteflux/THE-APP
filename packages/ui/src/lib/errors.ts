import { VueConstructor, PluginObject } from "vue";

export interface SError<T> {
    msg: string;
    sample: T | null;
    wipe: () => void;
}

export const emptyErr = <T>(): SError<T> => {
    const _err = { msg: "", sample: null, wipe: () => {} };
    return new Proxy(
        _err,
        {
            get: (obj: any, prop: string) => {
                if (prop == "wipe")
                    return () => {
                        obj.msg = "";
                        obj.sample = null;
                    };
                return obj[prop];
            }
        }
    )
}

export const mkErrFrom = <T>(msg: string, sample: T): SError<T> => {
    const e: SError<T> = emptyErr();
    e.msg = msg;
    e.sample = sample;
    return e;
};

export const mkErrContainer = (): any => {
    let newObj = {};
    return new Proxy(newObj, {
        get: (obj: any, prop: string) => {
            return prop in obj ? obj[prop] : emptyErr();
        },
        set: (obj: any, prop: string, value: any) => {
            obj[prop] = value;
            return true;
        }
    });
};

const FluxErrHandler: PluginObject<{}> = {
    install: (Vue: VueConstructor) => {
        Vue.prototype.$err = <T>(msg: string, orig: T): SError<T> => {
            Vue.prototype.$notify({
                title: "Error",
                text: msg,
                type: "error"
            });
            return mkErrFrom(msg, orig);
        };

        Vue.prototype.$unknownErr = <T>(e: T): SError<T> => {
            // debugger;
            // eslint-disable-next-line
            console.log("Unknown error", e)
            return Vue.prototype.$err("Unknown error", e)
        };
    }
};

export default FluxErrHandler;
