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
exports.TaskRunnerServer = void 0;
const config_1 = require("@n8n/config");
const compression_1 = __importDefault(require("compression"));
const express_1 = __importDefault(require("express"));
const a = __importStar(require("node:assert/strict"));
const node_crypto_1 = require("node:crypto");
const node_http_1 = require("node:http");
const node_url_1 = require("node:url");
const typedi_1 = require("typedi");
const ws_1 = require("ws");
const constants_1 = require("../constants");
const logger_service_1 = require("../logging/logger.service");
const middlewares_1 = require("../middlewares");
const response_helper_1 = require("../response-helper");
const task_runner_auth_controller_1 = require("../runners/auth/task-runner-auth.controller");
const runner_ws_server_1 = require("../runners/runner-ws-server");
let TaskRunnerServer = class TaskRunnerServer {
    get port() {
        return this.server?.address()?.port;
    }
    get upgradeEndpoint() {
        return `${this.getEndpointBasePath()}/_ws`;
    }
    constructor(logger, globalConfig, taskRunnerAuthController, taskRunnerWsServer) {
        this.logger = logger;
        this.globalConfig = globalConfig;
        this.taskRunnerAuthController = taskRunnerAuthController;
        this.taskRunnerWsServer = taskRunnerWsServer;
        this.handleUpgradeRequest = (request, socket, head) => {
            if ((0, node_url_1.parse)(request.url).pathname !== this.upgradeEndpoint) {
                socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
                socket.destroy();
                return;
            }
            if (!this.wsServer) {
                socket.write('HTTP/1.1 503 Service Unavailable\r\n\r\n');
                socket.destroy();
                return;
            }
            this.wsServer.handleUpgrade(request, socket, head, (ws) => {
                request.ws = ws;
                const response = new node_http_1.ServerResponse(request);
                response.writeHead = (statusCode) => {
                    if (statusCode > 200) {
                        this.logger.error(`Task runner connection attempt failed with status code ${statusCode}`);
                        ws.close();
                    }
                    return response;
                };
                this.app.handle(request, response);
            });
        };
        this.app = (0, express_1.default)();
        this.app.disable('x-powered-by');
        if (!this.globalConfig.taskRunners.authToken) {
            this.globalConfig.taskRunners.authToken = (0, node_crypto_1.randomBytes)(32).toString('hex');
        }
    }
    async start() {
        await this.setupHttpServer();
        this.setupWsServer();
        if (!constants_1.inTest) {
            await this.setupErrorHandlers();
        }
        this.setupCommonMiddlewares();
        this.configureRoutes();
    }
    async stop() {
        if (this.wsServer) {
            this.wsServer.close();
            this.wsServer = undefined;
        }
        const stopHttpServerTask = (async () => {
            if (this.server) {
                await new Promise((resolve) => this.server?.close(() => resolve()));
                this.server = undefined;
            }
        })();
        const stopWsServerTask = this.taskRunnerWsServer.stop();
        await Promise.all([stopHttpServerTask, stopWsServerTask]);
    }
    async setupHttpServer() {
        const { app } = this;
        this.server = (0, node_http_1.createServer)(app);
        const { taskRunners: { port, listenAddress: address }, } = this.globalConfig;
        this.server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                this.logger.info(`n8n Task Runner's port ${port} is already in use. Do you have another instance of n8n running already?`);
                process.exit(1);
            }
        });
        await new Promise((resolve) => {
            a.ok(this.server);
            this.server.listen(port, address, () => resolve());
        });
        this.logger.info(`n8n Task Runner server ready on ${address}, port ${port}`);
    }
    setupWsServer() {
        const { authToken } = this.globalConfig.taskRunners;
        a.ok(authToken);
        a.ok(this.server);
        this.wsServer = new ws_1.Server({
            noServer: true,
            maxPayload: this.globalConfig.taskRunners.maxPayload,
        });
        this.server.on('upgrade', this.handleUpgradeRequest);
        this.taskRunnerWsServer.start();
    }
    async setupErrorHandlers() {
        const { app } = this;
        if (this.globalConfig.sentry.backendDsn) {
            const { Handlers: { requestHandler, errorHandler }, } = await Promise.resolve().then(() => __importStar(require('@sentry/node')));
            app.use(requestHandler());
            app.use(errorHandler());
        }
    }
    setupCommonMiddlewares() {
        this.app.use((0, compression_1.default)());
        this.app.use(middlewares_1.rawBodyReader);
        this.app.use(middlewares_1.bodyParser);
    }
    configureRoutes() {
        this.app.use(this.upgradeEndpoint, this.taskRunnerAuthController.authMiddleware, (req, res) => this.taskRunnerWsServer.handleRequest(req, res));
        const authEndpoint = `${this.getEndpointBasePath()}/auth`;
        this.app.post(authEndpoint, (0, response_helper_1.send)(async (req) => await this.taskRunnerAuthController.createGrantToken(req)));
    }
    getEndpointBasePath() {
        let path = this.globalConfig.taskRunners.path;
        if (!path.startsWith('/')) {
            path = `/${path}`;
        }
        if (path.endsWith('/')) {
            path = path.slice(-1);
        }
        return path;
    }
};
exports.TaskRunnerServer = TaskRunnerServer;
exports.TaskRunnerServer = TaskRunnerServer = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [logger_service_1.Logger,
        config_1.GlobalConfig,
        task_runner_auth_controller_1.TaskRunnerAuthController,
        runner_ws_server_1.TaskRunnerWsServer])
], TaskRunnerServer);
//# sourceMappingURL=task-runner-server.js.map