import * as t from 'io-ts'
import { base64ToUint8a } from '../../utils'

export const SzObjectIdRT = t.refinement(t.string, s => console.warn('SzObjectRT check not implemented:', s) || true || s.length === 14)
export type SzObjectId = t.TypeOf<typeof SzObjectIdRT>

export const HashRT = t.refinement(t.string, s => base64ToUint8a(s).length === 32)
export type HashTy = t.TypeOf<typeof HashRT>
