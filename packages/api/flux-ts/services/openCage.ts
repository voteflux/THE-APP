// integrating with opencagedata.com
import { either, Either } from 'fp-ts';

Either

const apiKey = process.env.OPENCAGE_API

export enum OpenCageErrs {
    NO_API
}
type Errs = OpenCageErrs
const Errs = OpenCageErrs

const w = <R>(f: (...args: any[]) => R) => (...args): Either<Errs, R> => {
    if (!apiKey) {
        return either.left(Errs.NO_API)
        
    }
    return f(...args)
}

export const 