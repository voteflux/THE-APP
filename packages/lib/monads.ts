import { Either, Left, Right, left, right } from 'fp-ts/lib/Either'

type _PE<L,R> = Promise<Either<L,R>>

const _throw = <L>(l: L) => { throw l; }

export class EitherPromi<L,R> {
    private prom: Promise<Either<L,R>>

    constructor(f?: (res: (e: Either<L,R>) => void, rej: (a: any) => void) => void, _pe?: _PE<L,R>) {
        if (f)
            this.prom = new Promise(f).then(right).catch(left) as Promise<Either<L,R>>
        else if (_pe)
            this.prom = _pe
        else
            throw TypeError("At least one of `f` or `_pe` must be provided to EitherPromi constructor")
    }

    private _setNewProm(e: Either<L,R>) {
        this.prom = new Promise((res, rej) => res(e))
    }

    static fromEither<L,R>(e: Either<L,R>): EitherPromi<L,R> {
        return new EitherPromi((res, rej) => res(e))
    }

    mapLeft<L2>(f: (l: L) => L2): EitherPromi<L2, R> {
        return new EitherPromi(undefined, this.prom.then(e => e.mapLeft(f)))
    }

    map<R2>(f: (r: R) => R2): EitherPromi<L, R2> {
        return new EitherPromi(undefined, this.prom.then(e => e.map(f)))
    }

    chain<R2>(f: (r: R) => Either<L, R2>): EitherPromi<L, R2> {
        return new EitherPromi(undefined, this.prom.then(e => e.chain(f)))
    }

    async isLeft(): Promise<boolean> {
        const e = await this.peek()
        return e.isLeft()
    }

    async isRight(): Promise<boolean> {
        const e = await this.peek()
        return e.isRight()
    }

    // async thenChain<R2>(f: (r: R) => Either<L, R2>): EitherPromi

    async then<R2>(f: (r: R) => EitherPromi<L, R2> | Either<L, R2> | R2): Promise<R2> {
        const e = await this.prom
        const r = e.getOrElseL(_throw)
        const res = f(r)
        if (res instanceof EitherPromi)
            return await res
        if (res instanceof Left || res instanceof Right)
            return res.getOrElseL(_throw)
        return res
    }

    async peek(): Promise<Either<L,R>> {
        const v = await this.prom
        this._setNewProm(v)
        return v
    }
}
