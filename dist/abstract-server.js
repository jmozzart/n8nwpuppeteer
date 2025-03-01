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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbstractServer = void 0;
const config_1 = require("@n8n/config");
const compression_1 = __importDefault(require("compression"));
const express_1 = __importDefault(require("express"));
const express_handlebars_1 = require("express-handlebars");
const promises_1 = require("fs/promises");
const isbot_1 = __importDefault(require("isbot"));
const typedi_1 = require("typedi");
const config_2 = __importDefault(require("./config"));
const constants_1 = require("./constants");
const Db = __importStar(require("./db"));
const on_shutdown_1 = require("./decorators/on-shutdown");
const external_hooks_1 = require("./external-hooks");
const logger_service_1 = require("./logging/logger.service");
const middlewares_1 = require("./middlewares");
const response_helper_1 = require("./response-helper");
const live_webhooks_1 = require("./webhooks/live-webhooks");
const test_webhooks_1 = require("./webhooks/test-webhooks");
const waiting_forms_1 = require("./webhooks/waiting-forms");
const waiting_webhooks_1 = require("./webhooks/waiting-webhooks");
const webhook_request_handler_1 = require("./webhooks/webhook-request-handler");
const service_unavailable_error_1 = require("./errors/response-errors/service-unavailable.error");
let AbstractServer = class AbstractServer {
    constructor() {
        this.globalConfig = typedi_1.Container.get(config_1.GlobalConfig);
        this.webhooksEnabled = true;
        this.testWebhooksEnabled = false;
        this.app = (0, express_1.default)();
        this.app.disable('x-powered-by');
        this.app.engine('handlebars', (0, express_handlebars_1.engine)({ defaultLayout: false }));
        this.app.set('view engine', 'handlebars');
        this.app.set('views', constants_1.TEMPLATES_DIR);
        const proxyHops = config_2.default.getEnv('proxy_hops');
        if (proxyHops > 0)
            this.app.set('trust proxy', proxyHops);
        this.sslKey = config_2.default.getEnv('ssl_key');
        this.sslCert = config_2.default.getEnv('ssl_cert');
        this.restEndpoint = this.globalConfig.endpoints.rest;
        this.endpointForm = this.globalConfig.endpoints.form;
        this.endpointFormTest = this.globalConfig.endpoints.formTest;
        this.endpointFormWaiting = this.globalConfig.endpoints.formWaiting;
        this.endpointWebhook = this.globalConfig.endpoints.webhook;
        this.endpointWebhookTest = this.globalConfig.endpoints.webhookTest;
        this.endpointWebhookWaiting = this.globalConfig.endpoints.webhookWaiting;
        this.logger = typedi_1.Container.get(logger_service_1.Logger);
    }
    async configure() {
    }
    async setupErrorHandlers() {
        const { app } = this;
        const { Handlers: { requestHandler, errorHandler }, } = await Promise.resolve().then(() => __importStar(require('@sentry/node')));
        app.use(requestHandler());
        app.use(errorHandler());
    }
    setupCommonMiddlewares() {
        this.app.use((0, compression_1.default)());
        this.app.use(middlewares_1.rawBodyReader);
    }
    setupDevMiddlewares() {
        this.app.use(middlewares_1.corsMiddleware);
    }
    setupPushServer() { }
    async setupHealthCheck() {
        this.app.get('/healthz', async (_req, res) => {
            res.send({ status: 'ok' });
        });
        this.app.get('/healthz/readiness', async (_req, res) => {
            return Db.connectionState.connected && Db.connectionState.migrated
                ? res.status(200).send({ status: 'ok' })
                : res.status(503).send({ status: 'error' });
        });
        const { connectionState } = Db;
        this.app.use((_req, res, next) => {
            if (connectionState.connected) {
                if (connectionState.migrated)
                    next();
                else
                    res.send('n8n is starting up. Please wait');
            }
            else
                (0, response_helper_1.sendErrorResponse)(res, new service_unavailable_error_1.ServiceUnavailableError('Database is not ready!'));
        });
    }
    async init() {
        const { app, sslKey, sslCert } = this;
        const { protocol } = this.globalConfig;
        if (protocol === 'https' && sslKey && sslCert) {
            const https = await Promise.resolve().then(() => __importStar(require('https')));
            this.server = https.createServer({
                key: await (0, promises_1.readFile)(this.sslKey, 'utf8'),
                cert: await (0, promises_1.readFile)(this.sslCert, 'utf8'),
            }, app);
        }
        else {
            const http = await Promise.resolve().then(() => __importStar(require('http')));
            this.server = http.createServer(app);
        }
        const { port, listen_address: address } = typedi_1.Container.get(config_1.GlobalConfig);
        this.server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                this.logger.info(`n8n's port ${port} is already in use. Do you have another instance of n8n running already?`);
                process.exit(1);
            }
        });
        await new Promise((resolve) => this.server.listen(port, address, () => resolve()));
        this.externalHooks = typedi_1.Container.get(external_hooks_1.ExternalHooks);
        await this.setupHealthCheck();
        this.logger.info(`n8n ready on ${address}, port ${port}`);
    }
    async start() {
        if (!constants_1.inTest) {
            await this.setupErrorHandlers();
            this.setupPushServer();
        }
        this.setupCommonMiddlewares();
        if (this.webhooksEnabled) {
            const liveWebhooksRequestHandler = (0, webhook_request_handler_1.createWebhookHandlerFor)(typedi_1.Container.get(live_webhooks_1.LiveWebhooks));
            this.app.all(`/${this.endpointForm}/:path(*)`, liveWebhooksRequestHandler);
            this.app.all(`/${this.endpointWebhook}/:path(*)`, liveWebhooksRequestHandler);
            this.app.all(`/${this.endpointFormWaiting}/:path/:suffix?`, (0, webhook_request_handler_1.createWebhookHandlerFor)(typedi_1.Container.get(waiting_forms_1.WaitingForms)));
            this.app.all(`/${this.endpointWebhookWaiting}/:path/:suffix?`, (0, webhook_request_handler_1.createWebhookHandlerFor)(typedi_1.Container.get(waiting_webhooks_1.WaitingWebhooks)));
        }
        if (this.testWebhooksEnabled) {
            const testWebhooksRequestHandler = (0, webhook_request_handler_1.createWebhookHandlerFor)(typedi_1.Container.get(test_webhooks_1.TestWebhooks));
            this.app.all(`/${this.endpointFormTest}/:path(*)`, testWebhooksRequestHandler);
            this.app.all(`/${this.endpointWebhookTest}/:path(*)`, testWebhooksRequestHandler);
        }
        const checkIfBot = isbot_1.default.spawn(['bot']);
        this.app.use((req, res, next) => {
            const userAgent = req.headers['user-agent'];
            if (userAgent && checkIfBot(userAgent)) {
                this.logger.info(`Blocked ${req.method} ${req.url} for "${userAgent}"`);
                res.status(204).end();
            }
            else
                next();
        });
        if (constants_1.inDevelopment) {
            this.setupDevMiddlewares();
        }
        if (this.testWebhooksEnabled) {
            const testWebhooks = typedi_1.Container.get(test_webhooks_1.TestWebhooks);
            this.app.delete(`/${this.restEndpoint}/test-webhook/:id`, (0, response_helper_1.send)(async (req) => await testWebhooks.cancelWebhook(req.params.id)));
        }
        this.app.use(middlewares_1.bodyParser);
        await this.configure();
        if (!constants_1.inTest) {
            this.logger.info(`Version: ${constants_1.N8N_VERSION}`);
            const defaultLocale = config_2.default.getEnv('defaultLocale');
            if (defaultLocale !== 'en') {
                this.logger.info(`Locale: ${defaultLocale}`);
            }
            await this.externalHooks.run('n8n.ready', [this, config_2.default]);
        }
    }
    async onShutdown() {
        if (!this.server) {
            return;
        }
        const { protocol } = this.globalConfig;
        this.logger.debug(`Shutting down ${protocol} server`);
        this.server.close((error) => {
            if (error) {
                this.logger.error(`Error while shutting down ${protocol} server`, { error });
            }
            this.logger.debug(`${protocol} server shut down`);
        });
    }
};
exports.AbstractServer = AbstractServer;
__decorate([
    (0, on_shutdown_1.OnShutdown)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AbstractServer.prototype, "onShutdown", null);
exports.AbstractServer = AbstractServer = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [])
], AbstractServer);
//# sourceMappingURL=abstract-server.js.map