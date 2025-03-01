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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskRunnerAuthService = void 0;
const config_1 = require("@n8n/config");
const crypto_1 = require("crypto");
const typedi_1 = require("typedi");
const constants_1 = require("../../constants");
const cache_service_1 = require("../../services/cache/cache.service");
const GRANT_TOKEN_TTL = 15 * constants_1.Time.seconds.toMilliseconds;
let TaskRunnerAuthService = class TaskRunnerAuthService {
    constructor(globalConfig, cacheService, grantTokenTtl = GRANT_TOKEN_TTL) {
        this.globalConfig = globalConfig;
        this.cacheService = cacheService;
        this.grantTokenTtl = grantTokenTtl;
    }
    isValidAuthToken(token) {
        return token === this.globalConfig.taskRunners.authToken;
    }
    async createGrantToken() {
        const grantToken = this.generateGrantToken();
        const key = this.cacheKeyForGrantToken(grantToken);
        await this.cacheService.set(key, '1', this.grantTokenTtl);
        return grantToken;
    }
    async tryConsumeGrantToken(grantToken) {
        const key = this.cacheKeyForGrantToken(grantToken);
        const consumed = await this.cacheService.get(key);
        if (consumed === undefined)
            return false;
        await this.cacheService.delete(key);
        return true;
    }
    generateGrantToken() {
        return (0, crypto_1.randomBytes)(32).toString('hex');
    }
    cacheKeyForGrantToken(grantToken) {
        return `grant-token:${grantToken}`;
    }
};
exports.TaskRunnerAuthService = TaskRunnerAuthService;
exports.TaskRunnerAuthService = TaskRunnerAuthService = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [config_1.GlobalConfig,
        cache_service_1.CacheService, Object])
], TaskRunnerAuthService);
//# sourceMappingURL=task-runner-auth.service.js.map