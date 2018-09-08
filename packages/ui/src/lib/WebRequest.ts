enum RequestTag {
    NotRequested, Loading, Failed, Success
}
const RT = RequestTag

interface NetCases<D, E, R> {
    notRequested: () => R;
    loading: () => R;
    failed: (error: E, errObj?: any) => R;
    success: (data: D) => R;
};

type PartialCases<D,E,R> = Partial<NetCases<D,E,R>>

// define our types as <Error,Data> to match Either type order
export default class WebRequest<E,D> {
    /**
     * internal use only
     * @param tag
     * @param data
     * @param error
     */
    constructor(private tag: RequestTag, private data?: D, private error?: E, private errObj?: any) {
        if (tag === RT.Success && this.data === undefined)
            throw TypeError("Cannot create Successful web requests without a data value")
        if (tag === RT.Failed && this.error === undefined)
            throw TypeError("Cannot create Failed web request without an error value");
    }

    caseOf <R>(cases: NetCases<D, E, R>): R {
        switch (this.tag) {
          case RT.NotRequested:
            return cases.notRequested();
          case RT.Loading:
            return cases.loading();
          case RT.Failed:
            if (this.error === undefined)
                throw TypeError('WebRequest: this.error was undefined')
            return cases.failed(this.error, this.errObj);
          case RT.Success:
            if (this.data === undefined)
                throw TypeError('WebRequest: this.data was undefined')
            return cases.success(this.data);
        }
    }

    do (cases: PartialCases<D,E,void>): WebRequest<E,D> {
        const def = () => {}
        this.caseOf({
            loading: def, notRequested: def, success: def, failed: def,
            ...cases
        })
        return this;
    }

    isNotRequested() { return this.tag == RT.NotRequested }
    isLoading() { return this.tag == RT.Loading }
    isFailed() { return this.tag == RT.Failed }
    isSuccess() { return this.tag == RT.Success }

    static Failed = <E,D>(error: E, errObj?: any) => new WebRequest<E,D>(RT.Failed, undefined, error, errObj)
    static Loading = <E, D>() => new WebRequest<E,D>(RT.Loading)
    static NotRequested = <E,D>() => new WebRequest<E,D>(RT.NotRequested)
    static Success = <E,D>(data: D) => new WebRequest<E,D>(RT.Success, data)

    private clone<E2,D2>(): WebRequest<E2,D2> {
        return new WebRequest(this.tag, this.data as any, this.error as any)
    }

    mapFailed<E2>(f: (e: E) => E2): WebRequest<E2, D> {
        if (!this.isFailed())
            return this.clone()
        if (this.error === undefined)
            throw TypeError('WebRequest: this.error was undefined')
        return WebRequest.Failed<E2, D>(f(this.error))
    }

    bind<T>(f: (d: D) => WebRequest<E, T>) {
        if (this.isSuccess())
            return f(this.unwrap())
        return this.clone();
    }

    fmap<D2>(f: (d: D) => D2): WebRequest<E, D2> {
        return this.bind(v => WebRequest.Success(f(v))) as WebRequest<E, D2>
    }

    map = this.fmap
    mapSuccess = this.fmap

    unwrap(): D {
        if (this.tag !== RT.Success) throw TypeError("Cannot unwrap a WebRequest that is not Success")
        if (this.data === undefined) throw TypeError("Failed to unwrap WebRequest with data=undefined")
        return this.data
    }

    unwrapError(): E {
        if (this.tag !== RT.Failed) throw TypeError("Cannot unwrapError a WebRequest that is not Failed")
        if (this.error === undefined) throw TypeError("Failed to unwrapError with error=undefined")
        return this.error
    }

    unwrapOrDefault(d: D): D {
        if (this.tag === RT.Success && this.data)
            return this.data
        return d
    }
}
