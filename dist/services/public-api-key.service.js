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
exports.PublicApiKeyService = void 0;
const typedi_1 = require("typedi");
const api_key_1 = require("../databases/entities/api-key");
const api_key_repository_1 = require("../databases/repositories/api-key.repository");
const user_repository_1 = require("../databases/repositories/user.repository");
const event_service_1 = require("../events/event.service");
const jwt_service_1 = require("./jwt.service");
const API_KEY_AUDIENCE = 'public-api';
const API_KEY_ISSUER = 'n8n';
const REDACT_API_KEY_REVEAL_COUNT = 15;
const REDACT_API_KEY_MAX_LENGTH = 80;
let PublicApiKeyService = class PublicApiKeyService {
    constructor(apiKeyRepository, userRepository, jwtService, eventService) {
        this.apiKeyRepository = apiKeyRepository;
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.eventService = eventService;
        this.generateApiKey = (user) => this.jwtService.sign({ sub: user.id, iss: API_KEY_ISSUER, aud: API_KEY_AUDIENCE });
    }
    async createPublicApiKeyForUser(user) {
        const apiKey = this.generateApiKey(user);
        await this.apiKeyRepository.upsert(this.apiKeyRepository.create({
            userId: user.id,
            apiKey,
            label: 'My API Key',
        }), ['apiKey']);
        return await this.apiKeyRepository.findOneByOrFail({ apiKey });
    }
    async getRedactedApiKeysForUser(user) {
        const apiKeys = await this.apiKeyRepository.findBy({ userId: user.id });
        return apiKeys.map((apiKeyRecord) => ({
            ...apiKeyRecord,
            apiKey: this.redactApiKey(apiKeyRecord.apiKey),
        }));
    }
    async deleteApiKeyForUser(user, apiKeyId) {
        await this.apiKeyRepository.delete({ userId: user.id, id: apiKeyId });
    }
    async getUserForApiKey(apiKey) {
        return await this.userRepository
            .createQueryBuilder('user')
            .innerJoin(api_key_1.ApiKey, 'apiKey', 'apiKey.userId = user.id')
            .where('apiKey.apiKey = :apiKey', { apiKey })
            .select('user')
            .getOne();
    }
    redactApiKey(apiKey) {
        const visiblePart = apiKey.slice(0, REDACT_API_KEY_REVEAL_COUNT);
        const redactedPart = '*'.repeat(apiKey.length - REDACT_API_KEY_REVEAL_COUNT);
        const completeRedactedApiKey = visiblePart + redactedPart;
        return completeRedactedApiKey.slice(0, REDACT_API_KEY_MAX_LENGTH);
    }
    getAuthMiddleware(version) {
        return async (req, _scopes, schema) => {
            const providedApiKey = req.headers[schema.name.toLowerCase()];
            const user = await this.getUserForApiKey(providedApiKey);
            if (!user)
                return false;
            this.eventService.emit('public-api-invoked', {
                userId: user.id,
                path: req.path,
                method: req.method,
                apiVersion: version,
            });
            req.user = user;
            return true;
        };
    }
};
exports.PublicApiKeyService = PublicApiKeyService;
exports.PublicApiKeyService = PublicApiKeyService = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [api_key_repository_1.ApiKeyRepository,
        user_repository_1.UserRepository,
        jwt_service_1.JwtService,
        event_service_1.EventService])
], PublicApiKeyService);
//# sourceMappingURL=public-api-key.service.js.map