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
exports.WebhookService = void 0;
const typedi_1 = require("typedi");
const webhook_repository_1 = require("../databases/repositories/webhook.repository");
const cache_service_1 = require("../services/cache/cache.service");
let WebhookService = class WebhookService {
    constructor(webhookRepository, cacheService) {
        this.webhookRepository = webhookRepository;
        this.cacheService = cacheService;
    }
    async populateCache() {
        const allWebhooks = await this.webhookRepository.find();
        if (!allWebhooks)
            return;
        void this.cacheService.setMany(allWebhooks.map((w) => [w.cacheKey, w]));
    }
    async findCached(method, path) {
        const cacheKey = `webhook:${method}-${path}`;
        const cachedWebhook = await this.cacheService.get(cacheKey);
        if (cachedWebhook)
            return this.webhookRepository.create(cachedWebhook);
        let dbWebhook = await this.findStaticWebhook(method, path);
        if (dbWebhook === null) {
            dbWebhook = await this.findDynamicWebhook(method, path);
        }
        void this.cacheService.set(cacheKey, dbWebhook);
        return dbWebhook;
    }
    async findStaticWebhook(method, path) {
        return await this.webhookRepository.findOneBy({ webhookPath: path, method });
    }
    async findDynamicWebhook(method, path) {
        const [uuidSegment, ...otherSegments] = path.split('/');
        const dynamicWebhooks = await this.webhookRepository.findBy({
            webhookId: uuidSegment,
            method,
            pathLength: otherSegments.length,
        });
        if (dynamicWebhooks.length === 0)
            return null;
        const requestSegments = new Set(otherSegments);
        const { webhook } = dynamicWebhooks.reduce((acc, dw) => {
            const allStaticSegmentsMatch = dw.staticSegments.every((s) => requestSegments.has(s));
            if (allStaticSegmentsMatch && dw.staticSegments.length > acc.maxMatches) {
                acc.maxMatches = dw.staticSegments.length;
                acc.webhook = dw;
                return acc;
            }
            else if (dw.staticSegments.length === 0 && !acc.webhook) {
                acc.webhook = dw;
            }
            return acc;
        }, { webhook: null, maxMatches: 0 });
        return webhook;
    }
    async findWebhook(method, path) {
        return await this.findCached(method, path);
    }
    async storeWebhook(webhook) {
        void this.cacheService.set(webhook.cacheKey, webhook);
        await this.webhookRepository.upsert(webhook, ['method', 'webhookPath']);
    }
    createWebhook(data) {
        return this.webhookRepository.create(data);
    }
    async deleteWorkflowWebhooks(workflowId) {
        const webhooks = await this.webhookRepository.findBy({ workflowId });
        return await this.deleteWebhooks(webhooks);
    }
    async deleteWebhooks(webhooks) {
        void this.cacheService.deleteMany(webhooks.map((w) => w.cacheKey));
        return await this.webhookRepository.remove(webhooks);
    }
    async getWebhookMethods(path) {
        return await this.webhookRepository
            .find({ select: ['method'], where: { webhookPath: path } })
            .then((rows) => rows.map((r) => r.method));
    }
};
exports.WebhookService = WebhookService;
exports.WebhookService = WebhookService = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [webhook_repository_1.WebhookRepository,
        cache_service_1.CacheService])
], WebhookService);
//# sourceMappingURL=webhook.service.js.map