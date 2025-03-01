"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurlService = exports.flattenObject = void 0;
const get_1 = __importDefault(require("lodash/get"));
const n8n_workflow_1 = require("n8n-workflow");
const typedi_1 = require("typedi");
const curlconverter_1 = __importDefault(require("curlconverter"));
var ContentTypes;
(function (ContentTypes) {
    ContentTypes["applicationJson"] = "application/json";
    ContentTypes["applicationFormUrlEncoded"] = "application/x-www-form-urlencoded";
    ContentTypes["applicationMultipart"] = "multipart/form-data";
})(ContentTypes || (ContentTypes = {}));
const SUPPORTED_CONTENT_TYPES = [
    "application/json",
    "application/x-www-form-urlencoded",
    "multipart/form-data",
];
const CONTENT_TYPE_KEY = 'content-type';
const FOLLOW_REDIRECT_FLAGS = ['--location', '-L'];
const MAX_REDIRECT_FLAG = '--max-redirs';
const PROXY_FLAGS = ['-x', '--proxy'];
const INCLUDE_HEADERS_IN_OUTPUT_FLAGS = ['-i', '--include'];
const REQUEST_FLAGS = ['-X', '--request'];
const TIMEOUT_FLAGS = ['--connect-timeout'];
const DOWNLOAD_FILE_FLAGS = ['-O', '-o'];
const IGNORE_SSL_ISSUES_FLAGS = ['-k', '--insecure'];
const isContentType = (headers, contentType) => {
    return (0, get_1.default)(headers, CONTENT_TYPE_KEY) === contentType;
};
const isJsonRequest = (curlJson) => {
    if (isContentType(curlJson.headers, "application/json"))
        return true;
    if (curlJson.data) {
        const bodyKey = Object.keys(curlJson.data)[0];
        try {
            JSON.parse(bodyKey);
            return true;
        }
        catch {
            return false;
        }
    }
    return false;
};
const isFormUrlEncodedRequest = (curlJson) => {
    if (isContentType(curlJson.headers, "application/x-www-form-urlencoded"))
        return true;
    if (curlJson.data && !curlJson.files)
        return true;
    return false;
};
const isMultipartRequest = (curlJson) => {
    if (isContentType(curlJson.headers, "multipart/form-data"))
        return true;
    if (curlJson.files)
        return true;
    return false;
};
const isBinaryRequest = (curlJson) => {
    if (curlJson?.headers?.[CONTENT_TYPE_KEY]) {
        const contentType = curlJson?.headers?.[CONTENT_TYPE_KEY];
        return ['image', 'video', 'audio'].some((d) => contentType.includes(d));
    }
    return false;
};
const sanitizeCurlCommand = (curlCommand) => curlCommand
    .replace(/\r\n/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\\/g, ' ')
    .replace(/[ ]{2,}/g, ' ');
const toKeyValueArray = ([key, value]) => ({ name: key, value });
const extractHeaders = (headers = {}) => {
    const emptyHeaders = !Object.keys(headers).length;
    const onlyContentTypeHeaderDefined = Object.keys(headers).length === 1 && headers[CONTENT_TYPE_KEY] !== undefined;
    if (emptyHeaders || onlyContentTypeHeaderDefined)
        return { sendHeaders: false };
    return {
        sendHeaders: true,
        headerParameters: {
            parameters: Object.entries(headers)
                .map(toKeyValueArray)
                .filter((parameter) => parameter.name !== CONTENT_TYPE_KEY),
        },
    };
};
const extractQueries = (queries = {}) => {
    const emptyQueries = !Object.keys(queries).length;
    if (emptyQueries)
        return { sendQuery: false };
    return {
        sendQuery: true,
        queryParameters: {
            parameters: Object.entries(queries).map(toKeyValueArray),
        },
    };
};
const extractJson = (body) => (0, n8n_workflow_1.jsonParse)(Object.keys(body)[0]);
const jsonBodyToNodeParameters = (body = {}) => {
    const data = extractJson(body);
    return Object.entries(data).map(toKeyValueArray);
};
const multipartToNodeParameters = (body = {}, files = {}) => {
    return [
        ...Object.entries(body)
            .map(toKeyValueArray)
            .map((e) => ({ parameterType: 'formData', ...e })),
        ...Object.entries(files)
            .map(toKeyValueArray)
            .map((e) => ({ parameterType: 'formBinaryData', ...e })),
    ];
};
const keyValueBodyToNodeParameters = (body = {}) => {
    return Object.entries(body).map(toKeyValueArray);
};
const lowerCaseContentTypeKey = (obj) => {
    const regex = new RegExp(CONTENT_TYPE_KEY, 'gi');
    const contentTypeKey = Object.keys(obj).find((key) => {
        const group = Array.from(key.matchAll(regex));
        if (group.length)
            return true;
        return false;
    });
    if (!contentTypeKey)
        return;
    const value = obj[contentTypeKey];
    delete obj[contentTypeKey];
    obj[CONTENT_TYPE_KEY] = value;
};
const encodeBasicAuthentication = (username, password) => Buffer.from(`${username}:${password}`).toString('base64');
const jsonHasNestedObjects = (json) => Object.values(json).some((e) => typeof e === 'object');
const extractGroup = (curlCommand, regex) => curlCommand.matchAll(regex);
const mapCookies = (cookies) => {
    if (!cookies)
        return {};
    const cookiesValues = Object.entries(cookies).reduce((accumulator, entry) => {
        accumulator += `${entry[0]}=${entry[1]};`;
        return accumulator;
    }, '');
    if (!cookiesValues)
        return {};
    return {
        cookie: cookiesValues,
    };
};
const flattenObject = (obj, prefix = '') => Object.keys(obj).reduce((acc, k) => {
    const pre = prefix.length ? prefix + '.' : '';
    if (typeof obj[k] === 'object')
        Object.assign(acc, (0, exports.flattenObject)(obj[k], pre + k));
    else
        acc[pre + k] = obj[k];
    return acc;
}, {});
exports.flattenObject = flattenObject;
let CurlService = class CurlService {
    toHttpNodeParameters(curlCommand) {
        const curlJson = (0, n8n_workflow_1.jsonParse)(curlconverter_1.default.toJsonString(curlCommand));
        if (!curlJson.headers)
            curlJson.headers = {};
        lowerCaseContentTypeKey(curlJson.headers);
        if (curlJson.auth) {
            const { user, password: pass } = curlJson.auth;
            Object.assign(curlJson.headers, {
                authorization: `Basic ${encodeBasicAuthentication(user, pass)}`,
            });
        }
        const httpNodeParameters = {
            url: curlJson.url,
            authentication: 'none',
            method: curlJson.method.toUpperCase(),
            ...extractHeaders({ ...curlJson.headers, ...mapCookies(curlJson.cookies) }),
            ...extractQueries(curlJson.queries),
            options: {
                redirect: {
                    redirect: {},
                },
                response: {
                    response: {},
                },
            },
        };
        const curl = sanitizeCurlCommand(curlCommand);
        if (FOLLOW_REDIRECT_FLAGS.some((flag) => curl.includes(` ${flag}`))) {
            Object.assign(httpNodeParameters.options.redirect?.redirect, { followRedirects: true });
            if (curl.includes(` ${MAX_REDIRECT_FLAG}`)) {
                const extractedValue = Array.from(extractGroup(curl, new RegExp(` ${MAX_REDIRECT_FLAG} (\\d+)`, 'g')));
                if (extractedValue.length) {
                    const [_, maxRedirects] = extractedValue[0];
                    if (maxRedirects) {
                        Object.assign(httpNodeParameters.options.redirect?.redirect, { maxRedirects });
                    }
                }
            }
        }
        if (PROXY_FLAGS.some((flag) => curl.includes(` ${flag}`))) {
            const foundFlag = PROXY_FLAGS.find((flag) => curl.includes(` ${flag}`));
            if (foundFlag) {
                const extractedValue = Array.from(extractGroup(curl, new RegExp(` ${foundFlag} (\\S*)`, 'g')));
                if (extractedValue.length) {
                    const [_, proxy] = extractedValue[0];
                    Object.assign(httpNodeParameters.options, { proxy });
                }
            }
        }
        if (INCLUDE_HEADERS_IN_OUTPUT_FLAGS.some((flag) => curl.includes(` ${flag}`))) {
            Object.assign(httpNodeParameters.options?.response?.response, {
                fullResponse: true,
                responseFormat: 'autodetect',
            });
        }
        if (REQUEST_FLAGS.some((flag) => curl.includes(` ${flag}`))) {
            const foundFlag = REQUEST_FLAGS.find((flag) => curl.includes(` ${flag}`));
            if (foundFlag) {
                const extractedValue = Array.from(extractGroup(curl, new RegExp(` ${foundFlag} (\\w+)`, 'g')));
                if (extractedValue.length) {
                    const [_, request] = extractedValue[0];
                    httpNodeParameters.method = request.toUpperCase();
                }
            }
        }
        if (TIMEOUT_FLAGS.some((flag) => curl.includes(` ${flag}`))) {
            const foundFlag = TIMEOUT_FLAGS.find((flag) => curl.includes(` ${flag}`));
            if (foundFlag) {
                const extractedValue = Array.from(extractGroup(curl, new RegExp(` ${foundFlag} (\\d+)`, 'g')));
                if (extractedValue.length) {
                    const [_, timeout] = extractedValue[0];
                    Object.assign(httpNodeParameters.options, {
                        timeout: parseInt(timeout, 10) * 1000,
                    });
                }
            }
        }
        if (DOWNLOAD_FILE_FLAGS.some((flag) => curl.includes(` ${flag}`))) {
            const foundFlag = DOWNLOAD_FILE_FLAGS.find((flag) => curl.includes(` ${flag}`));
            if (foundFlag) {
                Object.assign(httpNodeParameters.options.response.response, {
                    responseFormat: 'file',
                    outputPropertyName: 'data',
                });
            }
        }
        if (IGNORE_SSL_ISSUES_FLAGS.some((flag) => curl.includes(` ${flag}`))) {
            const foundFlag = IGNORE_SSL_ISSUES_FLAGS.find((flag) => curl.includes(` ${flag}`));
            if (foundFlag) {
                Object.assign(httpNodeParameters.options, {
                    allowUnauthorizedCerts: true,
                });
            }
        }
        const contentType = curlJson?.headers?.[CONTENT_TYPE_KEY];
        if (isBinaryRequest(curlJson)) {
            return Object.assign(httpNodeParameters, {
                contentType: 'binaryData',
                sendBody: true,
            });
        }
        if (contentType && !SUPPORTED_CONTENT_TYPES.includes(contentType)) {
            return Object.assign(httpNodeParameters, {
                sendBody: true,
                contentType: 'raw',
                rawContentType: contentType,
                body: Object.keys(curlJson?.data ?? {})[0],
            });
        }
        if (isJsonRequest(curlJson)) {
            Object.assign(httpNodeParameters, {
                contentType: 'json',
                sendBody: true,
            });
            if (curlJson.data) {
                const json = extractJson(curlJson.data);
                if (jsonHasNestedObjects(json)) {
                    Object.assign(httpNodeParameters, {
                        specifyBody: 'json',
                        jsonBody: JSON.stringify(json, null, 2),
                    });
                }
                else {
                    Object.assign(httpNodeParameters, {
                        specifyBody: 'keypair',
                        bodyParameters: {
                            parameters: jsonBodyToNodeParameters(curlJson.data),
                        },
                    });
                }
            }
        }
        else if (isFormUrlEncodedRequest(curlJson)) {
            Object.assign(httpNodeParameters, {
                contentType: 'form-urlencoded',
                sendBody: true,
                specifyBody: 'keypair',
                bodyParameters: {
                    parameters: keyValueBodyToNodeParameters(curlJson.data),
                },
            });
        }
        else if (isMultipartRequest(curlJson)) {
            Object.assign(httpNodeParameters, {
                contentType: 'multipart-form-data',
                sendBody: true,
                bodyParameters: {
                    parameters: multipartToNodeParameters(curlJson.data, curlJson.files),
                },
            });
        }
        else {
            Object.assign(httpNodeParameters, {
                sendBody: false,
            });
        }
        if (!Object.keys(httpNodeParameters.options?.redirect.redirect).length) {
            delete httpNodeParameters.options.redirect;
        }
        if (!Object.keys(httpNodeParameters.options.response.response).length) {
            delete httpNodeParameters.options.response;
        }
        return httpNodeParameters;
    }
};
exports.CurlService = CurlService;
exports.CurlService = CurlService = __decorate([
    (0, typedi_1.Service)()
], CurlService);
//# sourceMappingURL=curl.service.js.map