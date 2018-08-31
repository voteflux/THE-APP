"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const R = require('ramda');
const handlerUtils = require('./handlerUtils');
const db = {}; // we will populate this obj later via DB.init(db)
module.exports.genStatsGetinfo = (event, context) => __awaiter(this, void 0, void 0, function* () {
    return { result: yield db.update_getinfo_stats() };
});
module.exports.genStatsPublic = (event, context) => __awaiter(this, void 0, void 0, function* () {
    return { result: yield db.update_public_stats() };
});
// Last part of file - wrap all handlers to automatically JSON.stringify responses
module.exports = R.mapObjIndexed(handlerUtils.wrapHandler(db), module.exports);
