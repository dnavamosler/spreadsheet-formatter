"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _spredSheetFormatter_token, _spredSheetFormatter_expDate, _spredSheetFormatter_account, _spredSheetFormatter_secret;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpreadSheetFormatter = void 0;
const jsonwebtoken_1 = require("jsonwebtoken");
const axios_1 = require("axios");
const moment = require('moment');
const googleSpreadsheetsApi = 'https://sheets.googleapis.com/v4/spreadsheets/';
const googleApiToken = 'https://oauth2.googleapis.com/token';
const googleApiDrive = 'https://www.googleapis.com/auth/drive';
const grantType = 'urn:ietf:params:oauth:grant-type:jwt-bearer';
class spredSheetFormatter {
    constructor() {
        _spredSheetFormatter_token.set(this, void 0);
        _spredSheetFormatter_expDate.set(this, void 0);
        _spredSheetFormatter_account.set(this, void 0);
        _spredSheetFormatter_secret.set(this, void 0);
        __classPrivateFieldSet(this, _spredSheetFormatter_token, null, "f");
        __classPrivateFieldSet(this, _spredSheetFormatter_expDate, null, "f");
        __classPrivateFieldSet(this, _spredSheetFormatter_account, null, "f");
        __classPrivateFieldSet(this, _spredSheetFormatter_secret, 'null', "f");
    }
    setConfig(secret, account) {
        __classPrivateFieldSet(this, _spredSheetFormatter_secret, secret, "f");
        __classPrivateFieldSet(this, _spredSheetFormatter_account, account, "f");
    }
    createJWT() {
        const date = moment();
        const expDate = moment(date).add({
            hours: 1
        });
        __classPrivateFieldSet(this, _spredSheetFormatter_expDate, expDate, "f");
        const payload = {
            iss: __classPrivateFieldGet(this, _spredSheetFormatter_account, "f"),
            scope: googleApiDrive,
            aud: googleApiToken,
            exp: expDate.unix(),
            iat: date.unix()
        };
        const token = (0, jsonwebtoken_1.sign)(payload, __classPrivateFieldGet(this, _spredSheetFormatter_secret, "f"), { algorithm: 'RS256' });
        const oAuthPayload = {
            grant_type: grantType,
            assertion: token
        };
        return axios_1.default
            .post(googleApiToken, oAuthPayload)
            .then((res) => {
            __classPrivateFieldSet(this, _spredSheetFormatter_token, res.data.access_token, "f");
        })
            .catch((err) => {
            __classPrivateFieldSet(this, _spredSheetFormatter_token, null, "f");
            console.error(err);
        });
    }
    checkAuthentication() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!__classPrivateFieldGet(this, _spredSheetFormatter_secret, "f") || !__classPrivateFieldGet(this, _spredSheetFormatter_account, "f")) {
                __classPrivateFieldSet(this, _spredSheetFormatter_token, null, "f");
                return;
            }
            if (!__classPrivateFieldGet(this, _spredSheetFormatter_token, "f")) {
                yield this.createJWT();
            }
            if (__classPrivateFieldGet(this, _spredSheetFormatter_token, "f") && moment(__classPrivateFieldGet(this, _spredSheetFormatter_expDate, "f")).isAfter(moment(), 'seconds')) {
                yield this.createJWT();
            }
        });
    }
    getPageSpreadSheet(spreadSheetId, pageTitle) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.checkAuthentication();
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const spreadSheetData = yield axios_1.default
                        .get(googleSpreadsheetsApi +
                        spreadSheetId +
                        '/values/' +
                        pageTitle +
                        '!A1:AZ9999', {
                        headers: {
                            Authorization: `Bearer ${__classPrivateFieldGet(this, _spredSheetFormatter_token, "f")}`
                        }
                    })
                        .then((e) => e.data)
                        .catch((e) => {
                        throw new Error('Error no fetch spreadsheet data!!');
                    });
                    const values = spreadSheetData.values;
                    if (!values) {
                        throw new Error('Metadatasheet has no values!!');
                    }
                    let metaData = {};
                    values.forEach(([title, description]) => {
                        if (title)
                            metaData = Object.assign(Object.assign({}, metaData), { [title.toLowerCase().split(' ').join('-')]: description });
                    });
                    resolve(metaData);
                }
                catch (error) {
                    reject(error);
                }
            }));
        });
    }
    getSpreadSheet(spreadSheetId, metadataId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.checkAuthentication();
            if (!__classPrivateFieldGet(this, _spredSheetFormatter_token, "f")) {
                console.error('Please set the config!!');
                return;
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const spreadSheetData = yield axios_1.default
                        .get(googleSpreadsheetsApi + spreadSheetId, {
                        headers: {
                            Authorization: `Bearer ${__classPrivateFieldGet(this, _spredSheetFormatter_token, "f")}`
                        }
                    })
                        .then((e) => e.data)
                        .catch((e) => {
                        throw new Error('Error no fetch spreadsheet data!!');
                    });
                    const sheets = spreadSheetData.sheets;
                    const metadataSheet = sheets.find((sheet) => { var _a; return ((_a = sheet.properties) === null || _a === void 0 ? void 0 : _a.sheetId) == metadataId; });
                    if (!metadataSheet) {
                        throw new Error('Error not found metadata spreadsheet!!');
                    }
                    const title = metadataSheet.properties.title;
                    const metaData = yield this.getPageSpreadSheet(spreadSheetId, title);
                    const DATA = { sheets, metaData };
                    resolve(DATA);
                }
                catch (error) {
                    reject(error);
                }
            }));
        });
    }
}
_spredSheetFormatter_token = new WeakMap(), _spredSheetFormatter_expDate = new WeakMap(), _spredSheetFormatter_account = new WeakMap(), _spredSheetFormatter_secret = new WeakMap();
const spreadSheet = new spredSheetFormatter();
exports.SpreadSheetFormatter = spreadSheet;
