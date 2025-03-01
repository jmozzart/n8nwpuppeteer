"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupPushHandler = exports.setupPushServer = exports.Push = void 0;
const http_1 = require("http");
const typedi_1 = require("typedi");
const url_1 = require("url");
const ws_1 = require("ws");
const auth_service_1 = require("../auth/auth.service");
const config_1 = __importDefault(require("../config"));
const on_shutdown_1 = require("../decorators/on-shutdown");
const bad_request_error_1 = require("../errors/response-errors/bad-request.error");
const publisher_service_1 = require("../scaling/pubsub/publisher.service");
const orchestration_service_1 = require("../services/orchestration.service");
const typed_emitter_1 = require("../typed-emitter");
const sse_push_1 = require("./sse.push");
const websocket_push_1 = require("./websocket.push");
const useWebSockets = config_1.default.getEnv('push.backend') === 'websocket';
let Push = class Push extends typed_emitter_1.TypedEmitter {
    constructor(orchestrationService, publisher) {
        super();
        this.orchestrationService = orchestrationService;
        this.publisher = publisher;
        this.isBidirectional = useWebSockets;
        this.backend = useWebSockets ? typedi_1.Container.get(websocket_push_1.WebSocketPush) : typedi_1.Container.get(sse_push_1.SSEPush);
        if (useWebSockets)
            this.backend.on('message', (msg) => this.emit('message', msg));
    }
    getBackend() {
        return this.backend;
    }
    handleRequest(req, res) {
        const { ws, query: { pushRef }, user, } = req;
        if (!pushRef) {
            if (ws) {
                ws.send('The query parameter "pushRef" is missing!');
                ws.close(1008);
                return;
            }
            throw new bad_request_error_1.BadRequestError('The query parameter "pushRef" is missing!');
        }
        if (req.ws) {
            this.backend.add(pushRef, user.id, req.ws);
        }
        else if (!useWebSockets) {
            this.backend.add(pushRef, user.id, { req, res });
        }
        else {
            res.status(401).send('Unauthorized');
            return;
        }
        this.emit('editorUiConnected', pushRef);
    }
    broadcast(type, data) {
        this.backend.sendToAll(type, data);
    }
    send(type, data, pushRef) {
        if (this.orchestrationService.isMultiMainSetupEnabled && !this.backend.hasPushRef(pushRef)) {
            void this.publisher.publishCommand({
                command: 'relay-execution-lifecycle-event',
                payload: { type, args: data, pushRef },
            });
            return;
        }
        this.backend.sendToOne(type, data, pushRef);
    }
    sendToUsers(type, data, userIds) {
        this.backend.sendToUsers(type, data, userIds);
    }
    onShutdown() {
        this.backend.closeAllConnections();
    }
};
exports.Push = Push;
__decorate([
    (0, on_shutdown_1.OnShutdown)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], Push.prototype, "onShutdown", null);
exports.Push = Push = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [orchestration_service_1.OrchestrationService,
        publisher_service_1.Publisher])
], Push);
const setupPushServer = (restEndpoint, server, app) => {
    if (useWebSockets) {
        const wsServer = new ws_1.Server({ noServer: true });
        server.on('upgrade', (request, socket, head) => {
            if ((0, url_1.parse)(request.url).pathname === `/${restEndpoint}/push`) {
                wsServer.handleUpgrade(request, socket, head, (ws) => {
                    request.ws = ws;
                    const response = new http_1.ServerResponse(request);
                    response.writeHead = (statusCode) => {
                        if (statusCode > 200)
                            ws.close();
                        return response;
                    };
                    app.handle(request, response);
                });
            }
        });
    }
};
exports.setupPushServer = setupPushServer;
const setupPushHandler = (restEndpoint, app) => {
    const endpoint = `/${restEndpoint}/push`;
    const push = typedi_1.Container.get(Push);
    const authService = typedi_1.Container.get(auth_service_1.AuthService);
    app.use(endpoint, authService.authMiddleware, (req, res) => push.handleRequest(req, res));
};
exports.setupPushHandler = setupPushHandler;
//# sourceMappingURL=index.js.map