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
exports.Publisher = void 0;
const n8n_core_1 = require("n8n-core");
const typedi_1 = require("typedi");
const config_1 = __importDefault(require("../../config"));
const logger_service_1 = require("../../logging/logger.service");
const redis_client_service_1 = require("../../services/redis-client.service");
const constants_1 = require("../constants");
let Publisher = class Publisher {
    constructor(logger, redisClientService, instanceSettings) {
        this.logger = logger;
        this.redisClientService = redisClientService;
        this.instanceSettings = instanceSettings;
        if (config_1.default.getEnv('executions.mode') !== 'queue')
            return;
        this.logger = this.logger.scoped(['scaling', 'pubsub']);
        this.client = this.redisClientService.createClient({ type: 'publisher(n8n)' });
    }
    getClient() {
        return this.client;
    }
    shutdown() {
        this.client.disconnect();
    }
    async publishCommand(msg) {
        if (config_1.default.getEnv('executions.mode') !== 'queue')
            return;
        await this.client.publish('n8n.commands', JSON.stringify({
            ...msg,
            senderId: this.instanceSettings.hostId,
            selfSend: constants_1.SELF_SEND_COMMANDS.has(msg.command),
            debounce: !constants_1.IMMEDIATE_COMMANDS.has(msg.command),
        }));
        this.logger.debug(`Published ${msg.command} to command channel`);
    }
    async publishWorkerResponse(msg) {
        await this.client.publish('n8n.worker-response', JSON.stringify(msg));
        this.logger.debug(`Published ${msg.response} to worker response channel`);
    }
    async setIfNotExists(key, value) {
        const success = await this.client.setnx(key, value);
        return !!success;
    }
    async setExpiration(key, ttl) {
        await this.client.expire(key, ttl);
    }
    async get(key) {
        return await this.client.get(key);
    }
    async clear(key) {
        await this.client?.del(key);
    }
};
exports.Publisher = Publisher;
exports.Publisher = Publisher = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [logger_service_1.Logger,
        redis_client_service_1.RedisClientService,
        n8n_core_1.InstanceSettings])
], Publisher);
//# sourceMappingURL=publisher.service.js.map