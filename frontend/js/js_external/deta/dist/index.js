
/**
 * @license
 * author: Deta
 * deta@1.2.0
 * Released under the MIT license.
 */

'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var fetch$1 = require('node-fetch');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var fetch__default = /*#__PURE__*/_interopDefaultLegacy(fetch$1);

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function __generator(thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
}

var url = {
    BASE: "https://:host/v1/:project_id/:base_name",
    DRIVE: "https://:host/v1/:project_id/:drive_name",
};
function base(host) {
    var _a;
    var hostPath = (host === null || host === void 0 ? void 0 : host.trim()) || ((_a = process.env.DETA_BASE_HOST) === null || _a === void 0 ? void 0 : _a.trim()) || 'database.deta.sh';
    return url.BASE.replace(':host', hostPath);
}
function drive(host) {
    var _a;
    var hostPath = (host === null || host === void 0 ? void 0 : host.trim()) || ((_a = process.env.DETA_DRIVE_HOST) === null || _a === void 0 ? void 0 : _a.trim()) || 'drive.deta.sh';
    return url.DRIVE.replace(':host', hostPath);
}
var url$1 = {
    base: base,
    drive: drive,
};

var KeyType;
(function (KeyType) {
    KeyType[KeyType["AuthToken"] = 0] = "AuthToken";
    KeyType[KeyType["ProjectKey"] = 1] = "ProjectKey";
})(KeyType || (KeyType = {}));

var Method;
(function (Method) {
    Method["Put"] = "PUT";
    Method["Get"] = "GET";
    Method["Post"] = "POST";
    Method["Patch"] = "PATCH";
    Method["Delete"] = "DELETE";
})(Method || (Method = {}));
var Requests = (function () {
    function Requests(key, type, baseURL) {
        this.requestConfig = {
            baseURL: baseURL,
            headers: type === KeyType.AuthToken
                ? { Authorization: key }
                : { 'X-API-Key': key },
        };
    }
    Requests.prototype.put = function (uri, payload) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2, Requests.fetch(uri, __assign(__assign({}, this.requestConfig), { body: payload, method: Method.Put }))];
            });
        });
    };
    Requests.prototype.delete = function (uri, payload) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2, Requests.fetch(uri, __assign(__assign({}, this.requestConfig), { body: payload, method: Method.Delete }))];
            });
        });
    };
    Requests.prototype.get = function (uri, config) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2, Requests.fetch(uri, __assign(__assign({}, this.requestConfig), { method: Method.Get, blobResponse: config === null || config === void 0 ? void 0 : config.blobResponse }))];
            });
        });
    };
    Requests.prototype.post = function (uri, init) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2, Requests.fetch(uri, __assign(__assign({}, this.requestConfig), { body: init.payload, method: Method.Post, headers: __assign(__assign({}, this.requestConfig.headers), init.headers) }))];
            });
        });
    };
    Requests.prototype.patch = function (uri, payload) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2, Requests.fetch(uri, __assign(__assign({}, this.requestConfig), { body: payload, method: Method.Patch }))];
            });
        });
    };
    Requests.fetch = function (url, config) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function () {
            var body, contentType, headers, response, data, message, blob, json;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 7, , 8]);
                        body = config.body instanceof Uint8Array
                            ? config.body
                            : JSON.stringify(config.body);
                        contentType = ((_a = config === null || config === void 0 ? void 0 : config.headers) === null || _a === void 0 ? void 0 : _a['Content-Type']) || 'application/json';
                        headers = __assign(__assign({}, config.headers), { 'Content-Type': contentType });
                        return [4, fetch("" + config.baseURL + url, {
                                body: body,
                                headers: headers,
                                method: config.method,
                            })];
                    case 1:
                        response = _c.sent();
                        if (!!response.ok) return [3, 3];
                        return [4, response.json()];
                    case 2:
                        data = _c.sent();
                        message = ((_b = data === null || data === void 0 ? void 0 : data.errors) === null || _b === void 0 ? void 0 : _b[0]) || 'Something went wrong';
                        return [2, {
                                status: response.status,
                                error: new Error(message),
                            }];
                    case 3:
                        if (!config.blobResponse) return [3, 5];
                        return [4, response.blob()];
                    case 4:
                        blob = _c.sent();
                        return [2, { status: response.status, response: blob }];
                    case 5: return [4, response.json()];
                    case 6:
                        json = _c.sent();
                        return [2, { status: response.status, response: json }];
                    case 7:
                        _c.sent();
                        return [2, { status: 500, error: new Error('Something went wrong') }];
                    case 8: return [2];
                }
            });
        });
    };
    return Requests;
}());

var BaseApi = {
    PUT_ITEMS: '/items',
    QUERY_ITEMS: '/query',
    INSERT_ITEMS: '/items',
    GET_ITEMS: '/items/:key',
    PATCH_ITEMS: '/items/:key',
    DELETE_ITEMS: '/items/:key',
};
var DriveApi = {
    GET_FILE: '/files/download?name=:name',
    DELETE_FILES: '/files',
    LIST_FILES: '/files?prefix=:prefix&recursive=:recursive&limit=:limit&last=:last',
    INIT_CHUNK_UPLOAD: '/uploads?name=:name',
    UPLOAD_FILE_CHUNK: '/uploads/:uid/parts?name=:name&part=:part',
    COMPLETE_FILE_UPLOAD: '/uploads/:uid?name=:name',
};

function isObject(value) {
    return Object.prototype.toString.call(value) === '[object Object]';
}

var Day = (function () {
    function Day(date) {
        this.date = date || new Date();
    }
    Day.prototype.addSeconds = function (seconds) {
        this.date = new Date(this.date.getTime() + 1000 * seconds);
        return this;
    };
    Day.prototype.getEpochSeconds = function () {
        return Math.floor(this.date.getTime() / 1000.0);
    };
    return Day;
}());

function isNumber(value) {
    return typeof value === 'number';
}

var ActionTypes;
(function (ActionTypes) {
    ActionTypes["Set"] = "set";
    ActionTypes["Trim"] = "trim";
    ActionTypes["Increment"] = "increment";
    ActionTypes["Append"] = "append";
    ActionTypes["Prepend"] = "prepend";
})(ActionTypes || (ActionTypes = {}));
var Action = (function () {
    function Action(action, value) {
        this.operation = action;
        this.value = value;
    }
    return Action;
}());

function isUndefinedOrNull(value) {
    return value === undefined || value === null;
}

var BaseUtils = (function () {
    function BaseUtils() {
    }
    BaseUtils.prototype.trim = function () {
        return new Action(ActionTypes.Trim);
    };
    BaseUtils.prototype.increment = function (value) {
        if (value === void 0) { value = 1; }
        return new Action(ActionTypes.Increment, value);
    };
    BaseUtils.prototype.append = function (value) {
        return new Action(ActionTypes.Append, Array.isArray(value) ? value : [value]);
    };
    BaseUtils.prototype.prepend = function (value) {
        return new Action(ActionTypes.Prepend, Array.isArray(value) ? value : [value]);
    };
    return BaseUtils;
}());
function getTTL(expireIn, expireAt) {
    if (isUndefinedOrNull(expireIn) && isUndefinedOrNull(expireAt)) {
        return {};
    }
    if (!isUndefinedOrNull(expireIn) && !isUndefinedOrNull(expireAt)) {
        return { error: new Error("can't set both expireIn and expireAt options") };
    }
    if (!isUndefinedOrNull(expireIn)) {
        if (!isNumber(expireIn)) {
            return {
                error: new Error('option expireIn should have a value of type number'),
            };
        }
        return { ttl: new Day().addSeconds(expireIn).getEpochSeconds() };
    }
    if (!(isNumber(expireAt) || expireAt instanceof Date)) {
        return {
            error: new Error('option expireAt should have a value of type number or Date'),
        };
    }
    if (expireAt instanceof Date) {
        return { ttl: new Day(expireAt).getEpochSeconds() };
    }
    return { ttl: expireAt };
}

var BaseGeneral = {
    TTL_ATTRIBUTE: '__expires',
};

var Base$1 = (function () {
    function Base(key, type, projectId, baseName, host) {
        var baseURL = url$1
            .base(host)
            .replace(':base_name', baseName)
            .replace(':project_id', projectId);
        this.requests = new Requests(key, type, baseURL);
        this.util = new BaseUtils();
    }
    Base.prototype.put = function (data, key, options) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function () {
            var _c, ttl, ttlError, payload, _d, response, error;
            var _e;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        _c = getTTL(options === null || options === void 0 ? void 0 : options.expireIn, options === null || options === void 0 ? void 0 : options.expireAt), ttl = _c.ttl, ttlError = _c.error;
                        if (ttlError) {
                            throw ttlError;
                        }
                        payload = [
                            __assign(__assign(__assign({}, (isObject(data) ? data : { value: data })), (key && { key: key })), (!isUndefinedOrNull(ttl) && (_e = {}, _e[BaseGeneral.TTL_ATTRIBUTE] = ttl, _e))),
                        ];
                        return [4, this.requests.put(BaseApi.PUT_ITEMS, {
                                items: payload,
                            })];
                    case 1:
                        _d = _f.sent(), response = _d.response, error = _d.error;
                        if (error) {
                            throw error;
                        }
                        return [2, ((_b = (_a = response === null || response === void 0 ? void 0 : response.processed) === null || _a === void 0 ? void 0 : _a.items) === null || _b === void 0 ? void 0 : _b[0]) || null];
                }
            });
        });
    };
    Base.prototype.get = function (key) {
        return __awaiter(this, void 0, void 0, function () {
            var trimmedKey, encodedKey, _a, status, response, error;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        trimmedKey = key === null || key === void 0 ? void 0 : key.trim();
                        if (!trimmedKey) {
                            throw new Error('Key is empty');
                        }
                        encodedKey = encodeURIComponent(trimmedKey);
                        return [4, this.requests.get(BaseApi.GET_ITEMS.replace(':key', encodedKey))];
                    case 1:
                        _a = _b.sent(), status = _a.status, response = _a.response, error = _a.error;
                        if (error && status !== 404) {
                            throw error;
                        }
                        if (status === 200) {
                            return [2, response];
                        }
                        return [2, null];
                }
            });
        });
    };
    Base.prototype.delete = function (key) {
        return __awaiter(this, void 0, void 0, function () {
            var trimmedKey, encodedKey, error;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        trimmedKey = key === null || key === void 0 ? void 0 : key.trim();
                        if (!trimmedKey) {
                            throw new Error('Key is empty');
                        }
                        encodedKey = encodeURIComponent(trimmedKey);
                        return [4, this.requests.delete(BaseApi.DELETE_ITEMS.replace(':key', encodedKey))];
                    case 1:
                        error = (_a.sent()).error;
                        if (error) {
                            throw error;
                        }
                        return [2, null];
                }
            });
        });
    };
    Base.prototype.insert = function (data, key, options) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, ttl, ttlError, payload, _b, status, response, error;
            var _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _a = getTTL(options === null || options === void 0 ? void 0 : options.expireIn, options === null || options === void 0 ? void 0 : options.expireAt), ttl = _a.ttl, ttlError = _a.error;
                        if (ttlError) {
                            throw ttlError;
                        }
                        payload = __assign(__assign(__assign({}, (isObject(data) ? data : { value: data })), (key && { key: key })), (!isUndefinedOrNull(ttl) && (_c = {}, _c[BaseGeneral.TTL_ATTRIBUTE] = ttl, _c)));
                        return [4, this.requests.post(BaseApi.INSERT_ITEMS, {
                                payload: {
                                    item: payload,
                                },
                            })];
                    case 1:
                        _b = _d.sent(), status = _b.status, response = _b.response, error = _b.error;
                        if (error && status === 409) {
                            throw new Error("Item with key " + key + " already exists");
                        }
                        if (error) {
                            throw error;
                        }
                        return [2, response];
                }
            });
        });
    };
    Base.prototype.putMany = function (items, options) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, ttl, ttlError, payload, _b, response, error;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!(items instanceof Array)) {
                            throw new Error('Items must be an array');
                        }
                        if (!items.length) {
                            throw new Error("Items can't be empty");
                        }
                        if (items.length > 25) {
                            throw new Error("We can't put more than 25 items at a time");
                        }
                        _a = getTTL(options === null || options === void 0 ? void 0 : options.expireIn, options === null || options === void 0 ? void 0 : options.expireAt), ttl = _a.ttl, ttlError = _a.error;
                        if (ttlError) {
                            throw ttlError;
                        }
                        payload = items.map(function (item) {
                            var _a;
                            var newItem = isObject(item) ? item : { value: item };
                            return __assign(__assign({}, newItem), (!isUndefinedOrNull(ttl) && (_a = {}, _a[BaseGeneral.TTL_ATTRIBUTE] = ttl, _a)));
                        });
                        return [4, this.requests.put(BaseApi.PUT_ITEMS, {
                                items: payload,
                            })];
                    case 1:
                        _b = _c.sent(), response = _b.response, error = _b.error;
                        if (error) {
                            throw error;
                        }
                        return [2, response];
                }
            });
        });
    };
    Base.prototype.update = function (updates, key, options) {
        return __awaiter(this, void 0, void 0, function () {
            var trimmedKey, _a, ttl, ttlError, payload, encodedKey, error;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        trimmedKey = key === null || key === void 0 ? void 0 : key.trim();
                        if (!trimmedKey) {
                            throw new Error('Key is empty');
                        }
                        _a = getTTL(options === null || options === void 0 ? void 0 : options.expireIn, options === null || options === void 0 ? void 0 : options.expireAt), ttl = _a.ttl, ttlError = _a.error;
                        if (ttlError) {
                            throw ttlError;
                        }
                        payload = {
                            set: __assign({}, (!isUndefinedOrNull(ttl) && (_b = {}, _b[BaseGeneral.TTL_ATTRIBUTE] = ttl, _b))),
                            increment: {},
                            append: {},
                            prepend: {},
                            delete: [],
                        };
                        Object.entries(updates).forEach(function (_a) {
                            var objKey = _a[0], objValue = _a[1];
                            var action = objValue instanceof Action
                                ? objValue
                                : new Action(ActionTypes.Set, objValue);
                            var operation = action.operation, value = action.value;
                            switch (operation) {
                                case ActionTypes.Trim: {
                                    payload.delete.push(objKey);
                                    break;
                                }
                                default: {
                                    payload[operation][objKey] = value;
                                }
                            }
                        });
                        encodedKey = encodeURIComponent(trimmedKey);
                        return [4, this.requests.patch(BaseApi.PATCH_ITEMS.replace(':key', encodedKey), payload)];
                    case 1:
                        error = (_c.sent()).error;
                        if (error) {
                            throw error;
                        }
                        return [2, null];
                }
            });
        });
    };
    Base.prototype.fetch = function (query, options) {
        if (query === void 0) { query = []; }
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b, limit, _c, last, _d, desc, sort, payload, _e, response, error, items, paging, count, resLast;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        _a = options || {}, _b = _a.limit, limit = _b === void 0 ? 1000 : _b, _c = _a.last, last = _c === void 0 ? '' : _c, _d = _a.desc, desc = _d === void 0 ? false : _d;
                        sort = desc ? 'desc' : '';
                        payload = {
                            query: Array.isArray(query) ? query : [query],
                            limit: limit,
                            last: last,
                            sort: sort,
                        };
                        return [4, this.requests.post(BaseApi.QUERY_ITEMS, {
                                payload: payload,
                            })];
                    case 1:
                        _e = _f.sent(), response = _e.response, error = _e.error;
                        if (error) {
                            throw error;
                        }
                        items = response.items, paging = response.paging;
                        count = paging.size, resLast = paging.last;
                        return [2, { items: items, count: count, last: resLast }];
                }
            });
        });
    };
    return Base;
}());

function isNode() {
    return (typeof process !== 'undefined' &&
        process.versions != null &&
        process.versions.node != null);
}

function isString(value) {
    return typeof value === 'string' || value instanceof String;
}

function stringToUint8Array(str) {
    var array = new Uint8Array(str.length);
    for (var i = 0; i < str.length; i += 1) {
        array[i] = str.charCodeAt(i);
    }
    return array;
}
function bufferToUint8Array(buffer) {
    var array = new Uint8Array(buffer.length);
    for (var i = 0; i < buffer.length; i += 1) {
        array[i] = buffer[i];
    }
    return array;
}

var Drive$1 = (function () {
    function Drive(key, type, projectId, driveName, host) {
        var baseURL = url$1
            .drive(host)
            .replace(':drive_name', driveName)
            .replace(':project_id', projectId);
        this.requests = new Requests(key, type, baseURL);
    }
    Drive.prototype.get = function (name) {
        return __awaiter(this, void 0, void 0, function () {
            var trimmedName, encodedName, _a, status, response, error;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        trimmedName = name === null || name === void 0 ? void 0 : name.trim();
                        if (!trimmedName) {
                            throw new Error('Name is empty');
                        }
                        encodedName = encodeURIComponent(trimmedName);
                        return [4, this.requests.get(DriveApi.GET_FILE.replace(':name', encodedName), {
                                blobResponse: true,
                            })];
                    case 1:
                        _a = _b.sent(), status = _a.status, response = _a.response, error = _a.error;
                        if (status === 404 && error) {
                            return [2, null];
                        }
                        if (error) {
                            throw error;
                        }
                        return [2, response];
                }
            });
        });
    };
    Drive.prototype.delete = function (name) {
        var _a;
        return __awaiter(this, void 0, void 0, function () {
            var trimmedName, payload, _b, response, error;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        trimmedName = name === null || name === void 0 ? void 0 : name.trim();
                        if (!trimmedName) {
                            throw new Error('Name is empty');
                        }
                        payload = {
                            names: [name],
                        };
                        return [4, this.requests.delete(DriveApi.DELETE_FILES, payload)];
                    case 1:
                        _b = _c.sent(), response = _b.response, error = _b.error;
                        if (error) {
                            throw error;
                        }
                        return [2, ((_a = response === null || response === void 0 ? void 0 : response.deleted) === null || _a === void 0 ? void 0 : _a[0]) || name];
                }
            });
        });
    };
    Drive.prototype.deleteMany = function (names) {
        return __awaiter(this, void 0, void 0, function () {
            var payload, _a, status, response, error;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!names.length) {
                            throw new Error("Names can't be empty");
                        }
                        if (names.length > 1000) {
                            throw new Error("We can't delete more than 1000 items at a time");
                        }
                        payload = {
                            names: names,
                        };
                        return [4, this.requests.delete(DriveApi.DELETE_FILES, payload)];
                    case 1:
                        _a = _b.sent(), status = _a.status, response = _a.response, error = _a.error;
                        if (status === 400 && error) {
                            throw new Error("Names can't be empty");
                        }
                        if (error) {
                            throw error;
                        }
                        return [2, response];
                }
            });
        });
    };
    Drive.prototype.list = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b, recursive, _c, prefix, _d, limit, _e, last, _f, response, error;
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0:
                        _a = options || {}, _b = _a.recursive, recursive = _b === void 0 ? true : _b, _c = _a.prefix, prefix = _c === void 0 ? '' : _c, _d = _a.limit, limit = _d === void 0 ? 1000 : _d, _e = _a.last, last = _e === void 0 ? '' : _e;
                        return [4, this.requests.get(DriveApi.LIST_FILES.replace(':prefix', prefix)
                                .replace(':recursive', recursive.toString())
                                .replace(':limit', limit.toString())
                                .replace(':last', last))];
                    case 1:
                        _f = _g.sent(), response = _f.response, error = _f.error;
                        if (error) {
                            throw error;
                        }
                        return [2, response];
                }
            });
        });
    };
    Drive.prototype.put = function (name, options) {
        return __awaiter(this, void 0, void 0, function () {
            var trimmedName, encodedName, buffer, fs, buf, _a, response, error;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        trimmedName = name === null || name === void 0 ? void 0 : name.trim();
                        if (!trimmedName) {
                            throw new Error('Name is empty');
                        }
                        encodedName = encodeURIComponent(trimmedName);
                        if (options.path && options.data) {
                            throw new Error('Please only provide data or a path. Not both');
                        }
                        if (!options.path && !options.data) {
                            throw new Error('Please provide data or a path. Both are empty');
                        }
                        if (options.path && !isNode()) {
                            throw new Error("Can't use path in browser environment");
                        }
                        buffer = new Uint8Array();
                        if (!options.path) return [3, 2];
                        fs = require('fs').promises;
                        return [4, fs.readFile(options.path)];
                    case 1:
                        buf = _b.sent();
                        buffer = new Uint8Array(buf);
                        _b.label = 2;
                    case 2:
                        if (options.data) {
                            if (isNode() && options.data instanceof Buffer) {
                                buffer = bufferToUint8Array(options.data);
                            }
                            else if (isString(options.data)) {
                                buffer = stringToUint8Array(options.data);
                            }
                            else if (options.data instanceof Uint8Array) {
                                buffer = options.data;
                            }
                            else {
                                throw new Error('Unsupported data format, expected data to be one of: string | Uint8Array | Buffer');
                            }
                        }
                        return [4, this.upload(encodedName, buffer, options.contentType || 'binary/octet-stream')];
                    case 3:
                        _a = _b.sent(), response = _a.response, error = _a.error;
                        if (error) {
                            throw error;
                        }
                        return [2, response];
                }
            });
        });
    };
    Drive.prototype.upload = function (name, data, contentType) {
        return __awaiter(this, void 0, void 0, function () {
            var contentLength, chunkSize, _a, response, error, uid, resName, part, idx, start, end, chunk, err_1, err;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        contentLength = data.byteLength;
                        chunkSize = 1024 * 1024 * 10;
                        return [4, this.requests.post(DriveApi.INIT_CHUNK_UPLOAD.replace(':name', name), {
                                headers: {
                                    'Content-Type': contentType,
                                },
                            })];
                    case 1:
                        _a = _b.sent(), response = _a.response, error = _a.error;
                        if (error) {
                            return [2, { error: error }];
                        }
                        uid = response.upload_id, resName = response.name;
                        part = 1;
                        idx = 0;
                        _b.label = 2;
                    case 2:
                        if (!(idx < contentLength)) return [3, 5];
                        start = idx;
                        end = Math.min(idx + chunkSize, contentLength);
                        chunk = data.slice(start, end);
                        return [4, this.requests.post(DriveApi.UPLOAD_FILE_CHUNK.replace(':uid', uid)
                                .replace(':name', name)
                                .replace(':part', part.toString()), {
                                payload: chunk,
                                headers: {
                                    'Content-Type': contentType,
                                },
                            })];
                    case 3:
                        err_1 = (_b.sent()).error;
                        if (err_1) {
                            return [2, { error: err_1 }];
                        }
                        part += 1;
                        _b.label = 4;
                    case 4:
                        idx += chunkSize;
                        return [3, 2];
                    case 5: return [4, this.requests.patch(DriveApi.COMPLETE_FILE_UPLOAD.replace(':uid', uid).replace(':name', name))];
                    case 6:
                        err = (_b.sent()).error;
                        if (err) {
                            return [2, { error: err }];
                        }
                        return [2, { response: resName }];
                }
            });
        });
    };
    return Drive;
}());

var Deta$1 = (function () {
    function Deta(key, type, projectId) {
        this.key = key;
        this.type = type;
        this.projectId = projectId;
    }
    Deta.prototype.Base = function (baseName, host) {
        var name = baseName === null || baseName === void 0 ? void 0 : baseName.trim();
        if (!name) {
            throw new Error('Base name is not defined');
        }
        return new Base$1(this.key, this.type, this.projectId, name, host);
    };
    Deta.prototype.Drive = function (driveName, host) {
        var name = driveName === null || driveName === void 0 ? void 0 : driveName.trim();
        if (!name) {
            throw new Error('Drive name is not defined');
        }
        return new Drive$1(this.key, this.type, this.projectId, name, host);
    };
    return Deta;
}());

function Deta(projectKey, authToken) {
    var _a;
    var token = authToken === null || authToken === void 0 ? void 0 : authToken.trim();
    var key = projectKey === null || projectKey === void 0 ? void 0 : projectKey.trim();
    if (token && key) {
        return new Deta$1(token, KeyType.AuthToken, key);
    }
    var apiKey = key || ((_a = process.env.DETA_PROJECT_KEY) === null || _a === void 0 ? void 0 : _a.trim());
    if (!apiKey) {
        throw new Error('Project key is not defined');
    }
    return new Deta$1(apiKey, KeyType.ProjectKey, apiKey.split('_')[0]);
}
function Base(baseName, host) {
    return Deta().Base(baseName, host);
}
function Drive(driveName, host) {
    return Deta().Drive(driveName, host);
}

if (!globalThis.fetch) {
    globalThis.fetch = fetch__default['default'];
}
exports.app = void 0;
exports.App = void 0;
try {
    var lib = require('detalib').App;
    exports.app = lib();
    exports.App = lib;
}
catch (_a) {
}

exports.Base = Base;
exports.Deta = Deta;
exports.Drive = Drive;
