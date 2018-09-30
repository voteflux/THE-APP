import { DBV1 } from 'flux-lib/types/db';
// integrating with opencagedata.com
import { either, left } from 'fp-ts/lib/Either';
import { some, none } from 'fp-ts/lib/Option'
import Axios from 'axios'
import { DBMethods } from '../db';

const CACHE_ADDR_COORDS = "addr_geo_coords"

const apiKey = process.env.OPENCAGE_API

const mkFwdGeocodeUrl = (address: string) => {
    const formattedAddr = encodeURIComponent(address)
    return `https://api.opencagedata.com/geocode/v1/json?no_annotations=1&key=${apiKey}&q=${formattedAddr}`
}

export enum OpenCageErrs {
    NO_API
}
type Errs = OpenCageErrs
const Errs = OpenCageErrs

type GeoDoc = { confidence: number, geometry: {lat:number, lng:number} }

export const getCoordinatesOfAddress = async (db: DBMethods, address: string) => {
    if (!apiKey) {
        throw "No OpenCageData API Key"
    }

    const knownCoords = await db.cache.check<GeoDoc>(CACHE_ADDR_COORDS, address)
    if (knownCoords.isRight()) {
        return some(knownCoords.value.geometry)
    }

    const url = mkFwdGeocodeUrl(address)
    const {data: req} = await Axios.get(url)
    let bestResult = {confidence: -1, geometry: {lat:0,lng:0}}
    for (let i = 0; i < req.results.length; i++) {
        if (req.results[i].confidence > bestResult.confidence)
            bestResult = req.results[i]
    }

    if (bestResult.confidence === -1) {
        return none
    }

    await db.cache.insert(CACHE_ADDR_COORDS, address, bestResult)

    return some(bestResult.geometry)
}
