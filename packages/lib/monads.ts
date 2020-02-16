import { Either, Left, Right, left, right, either, isLeft, isRight, getOrElse } from 'fp-ts/lib/Either'

type _PE<L,R> = Promise<Either<L,R>>

const _throw = <L>(l: L): any => { throw l; }

/**
 * This is a class which acts similarly to a Promise<Either<L,R>> with convenience methods.
*/
export class EitherProm<L,R> {
    private prom: Promise<Either<L,R>>

    private constructor(f?: (res: (e: Either<L,R>) => void, rej: (_: any) => void) => void, _pe?: _PE<L,R>) {
        if (f)
            this.prom = new Promise(f);
        else if (_pe)
            this.prom = _pe;
        else
            throw TypeError("At least one of `f` or `_pe` must be provided to EitherProm constructor");
    }

    private _setNewProm(e: Either<L,R>) {
        this.prom = new Promise((res, rej) => res(e))
    }

    static newState<L>(): EitherProm<L, {}> {
        return EitherProm.right({})
    }

    static fromPromiseEither<L,R>(pe: _PE<L,R>): EitherProm<L,R> {
        return new EitherProm(undefined, pe);
    }

    static fromEither<L,R>(e: Either<L,R>): EitherProm<L,R> {
        return new EitherProm((res, rej) => res(e))
    }

    static right<L, R>(r: R): EitherProm<L, R> {
        return new EitherProm((res, rej) => res(right(r)))
    }

    static left<L, R>(l: L): EitherProm<L, R> {
        return new EitherProm((res, rej) => res(left(l)))
    }

    async isLeft(): Promise<boolean> {
        const e = await this.peek()
        return isLeft(e)
    }

    async isRight(): Promise<boolean> {
        const e = await this.peek()
        return isRight(e)
    }

    mapLeft<L2>(f: (_: L) => L2): EitherProm<L2, R> {
        return EitherProm.fromPromiseEither(this.prom.then(e => either.mapLeft(e, f)))
    }

    map<R2>(f: (_: R) => R2): EitherProm<L, R2> {
        return EitherProm.fromPromiseEither(this.prom.then(e => either.map(e, f)))
    }

    chain<R2>(f: (_: R) => Either<L, R2>): EitherProm<L, R2> {
        return EitherProm.fromPromiseEither(this.prom.then(e => either.chain(e, f)))
    }

    thenChain<R2>(f: (_: R) => Promise<Either<L, R2>>): EitherProm<L, R2> {
        return EitherProm.fromPromiseEither(this.prom.then(e => isLeft(e) ? e : f(e.right)))
    }

    bind<R2>(f: (_: R) => EitherProm<L, R2>): EitherProm<L, R2> {
        return EitherProm.fromPromiseEither(this.prom.then(e => {
            if (isRight(e)) {
                return f(e.right).prom
            } else {
                return e
            }
        }))
    }

    // don't think there's an easier way to alias bind - MK
    then<R2>(f: (_: R) => EitherProm<L, R2>) {
        return this.bind<R2>(f)
    }

    /**
     * EitherProm.assign - the bastard child of `StateT s (EitherT String (Aff _ s))`
     * @param k A string known at compile time - the 'key' we assign a value to in the scope.
     * @param valueOrFunc One of: an EitherProm we'll assign directly, or a function
     *                    which takes the scope and returns an EitherProm with the result.
     *
     * Examples:
     * someState = EitherProm.newState()
     *                  .assign("key1", EitherProm.right(myValueOfArbitraryType))
     *
     * someState.assign("key1", EitherProm.right("another value"))
     * => Type Error: Argument of type '"k"' is not assignable to parameter of type 'KeyThatIsNotAlreadyAssigned'. ts(2345)
     *
     * someState.assign("dynamic" + "string", EitherProm.right("whatever"))
     * => Type Error: Argument of type 'string' is not assignable to parameter of type 'StringKnownAtCompileTime'. ts(2345)
     */
    assign<K extends string, R2>(
            k: AssignKeyTy<K, R>, // keyof R, KeyCannotAlreadyBeAssigned>,
            valueOrFunc: EitherProm<L, R2> | ((scope: R) => EitherProm<L, R2>)
    ): EitherProm<L, R & {[k in K]: R2}> {
        // todo: ensure `k` is not already in the current scope (which is of type R)
        return this.bind(r => {
            // get a mid-state EitherProm first
            const mid: EitherProm<L, R2> = valueOrFunc instanceof EitherProm
                ? valueOrFunc
                : valueOrFunc(r)
                // : r instanceof Object ? valueOrFunc(r as RScope) : EitherProm.left("Cannot use .assign with a right value that is not a record!")
            // Move value into a Record with one entry for unification with scope
            const extraState = mid.map(b => ({[k as K]: b} as {[k in K]: R2}))
            // return the combination of both
            return extraState.map(s => ({ ...r, ...s }))
        })
    }

    static join<L, R>(promiseEitherProm: Promise<EitherProm<L, R>>): EitherProm<L, R> {
        const newP = promiseEitherProm.then(ep => ep.prom)
        return new EitherProm(undefined, newP)
    }

    async peek(): Promise<Either<L,R>> {
        const v = await this.prom
        this._setNewProm(v)
        return v
    }
}


/**
 * Eq<X, Y, SuccessTy, ErrTy>
 * This type returns `SuccessTy` if X and Y are exactly equal.
 * If they are not it returns ErrTy.
 *
 * attrib: https://github.com/Microsoft/TypeScript/issues/27024#issuecomment-509504856
 */
export type Eq<X, Y, SuccessTy, ErrTy> =
    (<T>() => T extends X ? 1 : 2) extends
    (<T>() => T extends Y ? 1 : 2) ? SuccessTy : ErrTy;

// The corollary of the Eq type
export type NotEq<X, Y, SuccessTy, ErrTy> =
    Eq<X, Y, ErrTy, SuccessTy>

/**
 * And<Constraint1, Constraint2, SuccessTy>
 * Constraints should return either `true` if they are satisfied, or a custom error type (see
 * StringKnownAtCompileTime for an example). `And` will return the error type from either
 * constraint if they are not satisfied, and the SuccessTy if they are satisfied.
 */
export type And<X, Y, SuccessTy> =
    X extends true ? (Y extends true ? SuccessTy : Y) : X

// For whatever reason we need to have the StringKnownAtCompileTime constraint before the KeyThatIsNotAlreadyAssigned one.
// If they're the other way the error message is always KeyThatIsNotAlreadyAssigned even for dynamic strings.
type AssignKeyTy<K extends string, R> = And<NotEq<K, string, true, StringKnownAtCompileTime>, Eq<keyof R, keyof Omit<R, K>, true, KeyThatIsNotAlreadyAssigned>, K>

// If we directly alias `never` then the compiler will optimise our name out,
// which is how we communicate the error, so this should do for a workaround.
interface StringKnownAtCompileTime { n: never };
interface KeyThatIsNotAlreadyAssigned { n: never };

/*
 * NOTE: The below can be used to "test" the type properties in an IDE (or via TSC).
 * Unsure how to write an actual test to confirm type assertions. -MK

const res1 = EitherProm.newState()
    .assign("k", EitherProm.right(1))
    .assign("k1", EitherProm.right(42))
    .assign('k2', (s) => EitherProm.right(s.k + 1))
// type error examples
const res2 = res1
    .assign('k2', (s) => EitherProm.right(s.k + 1))
    .assign('sdf' + 'df', EitherProm.right('yis'))
*/

