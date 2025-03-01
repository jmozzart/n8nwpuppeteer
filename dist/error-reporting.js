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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initErrorHandling = void 0;
const config_1 = require("@n8n/config");
const typeorm_1 = require("@n8n/typeorm");
const axios_1 = require("axios");
const crypto_1 = require("crypto");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const typedi_1 = __importDefault(require("typedi"));
let initialized = false;
const initErrorHandling = async () => {
    if (initialized)
        return;
    process.on('uncaughtException', (error) => {
        n8n_workflow_1.ErrorReporterProxy.error(error);
    });
    const dsn = typedi_1.default.get(config_1.GlobalConfig).sentry.backendDsn;
    if (!dsn) {
        initialized = true;
        return;
    }
    Error.stackTraceLimit = 50;
    const { N8N_VERSION: release, ENVIRONMENT: environment, DEPLOYMENT_NAME: serverName, } = process.env;
    const { init, captureException, setTag } = await Promise.resolve().then(() => __importStar(require('@sentry/node')));
    const { RewriteFrames } = await Promise.resolve().then(() => __importStar(require('@sentry/integrations')));
    const { Integrations } = await Promise.resolve().then(() => __importStar(require('@sentry/node')));
    const enabledIntegrations = [
        'InboundFilters',
        'FunctionToString',
        'LinkedErrors',
        'OnUnhandledRejection',
        'ContextLines',
    ];
    const seenErrors = new Set();
    init({
        dsn,
        release,
        environment,
        enableTracing: false,
        serverName,
        beforeBreadcrumb: () => null,
        integrations: (integrations) => [
            ...integrations.filter(({ name }) => enabledIntegrations.includes(name)),
            new RewriteFrames({ root: process.cwd() }),
            new Integrations.RequestData({
                include: {
                    cookies: false,
                    data: false,
                    headers: false,
                    query_string: false,
                    url: true,
                    user: false,
                },
            }),
        ],
        async beforeSend(event, { originalException }) {
            if (!originalException)
                return null;
            if (originalException instanceof Promise) {
                originalException = await originalException.catch((error) => error);
            }
            if (originalException instanceof axios_1.AxiosError)
                return null;
            if (originalException instanceof typeorm_1.QueryFailedError &&
                ['SQLITE_FULL', 'SQLITE_IOERR'].some((errMsg) => originalException.message.includes(errMsg))) {
                return null;
            }
            if (originalException instanceof n8n_workflow_1.ApplicationError) {
                const { level, extra, tags } = originalException;
                if (level === 'warning')
                    return null;
                event.level = level;
                if (extra)
                    event.extra = { ...event.extra, ...extra };
                if (tags)
                    event.tags = { ...event.tags, ...tags };
            }
            if (originalException instanceof Error && originalException.stack) {
                const eventHash = (0, crypto_1.createHash)('sha1').update(originalException.stack).digest('base64');
                if (seenErrors.has(eventHash))
                    return null;
                seenErrors.add(eventHash);
            }
            return event;
        },
    });
    setTag('server_type', typedi_1.default.get(n8n_core_1.InstanceSettings).instanceType);
    n8n_workflow_1.ErrorReporterProxy.init({
        report: (error, options) => captureException(error, options),
    });
    initialized = true;
};
exports.initErrorHandling = initErrorHandling;
//# sourceMappingURL=error-reporting.js.map