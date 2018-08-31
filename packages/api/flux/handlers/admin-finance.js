'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const R = require('ramda');
const db = {}; // we will populate this obj later via DB.init(db)
const utils = require('../utils');
const handlerUtils = require('./handlerUtils');
const auth = require('./auth')(db);
const { Roles } = require('../roles');
module.exports.getDonations = auth.role(Roles.FINANCE, (event, context, { user }) => __awaiter(this, void 0, void 0, function* () {
    const data = event.body;
    const pageN = data.pageN || 0;
    const limit = data.limit || 10;
    const totalDonations = yield db.getDonationsN();
    return Object.assign({ donations: yield db.getDonations(pageN, limit), status: 'okay' }, utils.genPagination(totalDonations, limit, pageN));
}));
// Last part of file - wrap all handlers to automatically JSON.stringify responses
module.exports = R.mapObjIndexed(handlerUtils.wrapHandler(db), module.exports);
