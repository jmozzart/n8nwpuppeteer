"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateMetadata = validateMetadata;
exports.validateResponse = validateResponse;
const typedi_1 = require("typedi");
const logger_service_1 = require("../../logging/logger.service");
let xmlMetadata;
let xmlProtocol;
let preload = [];
let xmllintWasm;
async function loadSchemas() {
    xmlProtocol = (await Promise.resolve().then(() => __importStar(require('./schema/saml-schema-protocol-2.0.xsd')))).xmlFileInfo;
    xmlMetadata = (await Promise.resolve().then(() => __importStar(require('./schema/saml-schema-metadata-2.0.xsd')))).xmlFileInfo;
    preload = (await Promise.all([
        Promise.resolve().then(() => __importStar(require('./schema/saml-schema-assertion-2.0.xsd'))),
        Promise.resolve().then(() => __importStar(require('./schema/xmldsig-core-schema.xsd'))),
        Promise.resolve().then(() => __importStar(require('./schema/xenc-schema.xsd'))),
        Promise.resolve().then(() => __importStar(require('./schema/xml.xsd'))),
        Promise.resolve().then(() => __importStar(require('./schema/ws-federation.xsd'))),
        Promise.resolve().then(() => __importStar(require('./schema/oasis-200401-wss-wssecurity-secext-1.0.xsd'))),
        Promise.resolve().then(() => __importStar(require('./schema/oasis-200401-wss-wssecurity-utility-1.0.xsd'))),
        Promise.resolve().then(() => __importStar(require('./schema/ws-addr.xsd'))),
        Promise.resolve().then(() => __importStar(require('./schema/metadata-exchange.xsd'))),
        Promise.resolve().then(() => __importStar(require('./schema/ws-securitypolicy-1.2.xsd'))),
        Promise.resolve().then(() => __importStar(require('./schema/ws-authorization.xsd'))),
    ])).map((m) => m.xmlFileInfo);
}
async function loadXmllintWasm() {
    if (xmllintWasm === undefined) {
        typedi_1.Container.get(logger_service_1.Logger).debug('Loading xmllint-wasm library into memory');
        xmllintWasm = await Promise.resolve().then(() => __importStar(require('xmllint-wasm')));
    }
}
async function validateMetadata(metadata) {
    const logger = typedi_1.Container.get(logger_service_1.Logger);
    try {
        await loadXmllintWasm();
        await loadSchemas();
        const validationResult = await xmllintWasm?.validateXML({
            xml: [
                {
                    fileName: 'metadata.xml',
                    contents: metadata,
                },
            ],
            extension: 'schema',
            schema: [xmlMetadata],
            preload: [xmlProtocol, ...preload],
        });
        if (validationResult?.valid) {
            logger.debug('SAML Metadata is valid');
            return true;
        }
        else {
            logger.warn('SAML Validate Metadata: Invalid metadata');
            logger.warn(validationResult
                ? validationResult.errors
                    .map((error) => `${error.message} - ${error.rawMessage}`)
                    .join('\n')
                : '');
        }
    }
    catch (error) {
        logger.warn(error);
    }
    return false;
}
async function validateResponse(response) {
    const logger = typedi_1.Container.get(logger_service_1.Logger);
    try {
        await loadXmllintWasm();
        await loadSchemas();
        const validationResult = await xmllintWasm?.validateXML({
            xml: [
                {
                    fileName: 'response.xml',
                    contents: response,
                },
            ],
            extension: 'schema',
            schema: [xmlProtocol],
            preload: [xmlMetadata, ...preload],
        });
        if (validationResult?.valid) {
            logger.debug('SAML Response is valid');
            return true;
        }
        else {
            logger.warn('SAML Validate Response: Failed');
            logger.warn(validationResult
                ? validationResult.errors
                    .map((error) => `${error.message} - ${error.rawMessage}`)
                    .join('\n')
                : '');
        }
    }
    catch (error) {
        logger.warn(error);
    }
    return false;
}
//# sourceMappingURL=saml-validator.js.map