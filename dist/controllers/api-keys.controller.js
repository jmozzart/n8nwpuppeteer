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
exports.ApiKeysController = exports.isApiEnabledMiddleware = void 0;
const decorators_1 = require("../decorators");
const event_service_1 = require("../events/event.service");
const public_api_1 = require("../public-api");
const public_api_key_service_1 = require("../services/public-api-key.service");
const isApiEnabledMiddleware = (_, res, next) => {
    if ((0, public_api_1.isApiEnabled)()) {
        next();
    }
    else {
        res.status(404).end();
    }
};
exports.isApiEnabledMiddleware = isApiEnabledMiddleware;
let ApiKeysController = class ApiKeysController {
    constructor(eventService, publicApiKeyService) {
        this.eventService = eventService;
        this.publicApiKeyService = publicApiKeyService;
    }
    async createAPIKey(req) {
        const newApiKey = await this.publicApiKeyService.createPublicApiKeyForUser(req.user);
        this.eventService.emit('public-api-key-created', { user: req.user, publicApi: false });
        return newApiKey;
    }
    async getAPIKeys(req) {
        const apiKeys = await this.publicApiKeyService.getRedactedApiKeysForUser(req.user);
        return apiKeys;
    }
    async deleteAPIKey(req) {
        await this.publicApiKeyService.deleteApiKeyForUser(req.user, req.params.id);
        this.eventService.emit('public-api-key-deleted', { user: req.user, publicApi: false });
        return { success: true };
    }
};
exports.ApiKeysController = ApiKeysController;
__decorate([
    (0, decorators_1.Post)('/', { middlewares: [exports.isApiEnabledMiddleware] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ApiKeysController.prototype, "createAPIKey", null);
__decorate([
    (0, decorators_1.Get)('/', { middlewares: [exports.isApiEnabledMiddleware] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ApiKeysController.prototype, "getAPIKeys", null);
__decorate([
    (0, decorators_1.Delete)('/:id', { middlewares: [exports.isApiEnabledMiddleware] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ApiKeysController.prototype, "deleteAPIKey", null);
exports.ApiKeysController = ApiKeysController = __decorate([
    (0, decorators_1.RestController)('/api-keys'),
    __metadata("design:paramtypes", [event_service_1.EventService,
        public_api_key_service_1.PublicApiKeyService])
], ApiKeysController);
//# sourceMappingURL=api-keys.controller.js.map