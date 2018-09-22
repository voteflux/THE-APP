import { uint8aToBase64, strToUint8a } from './../utils/index';
import sha256 from 'fast-sha256';




export const uriHash = (uri: string): string => uint8aToBase64(sha256(strToUint8a(uri)))
