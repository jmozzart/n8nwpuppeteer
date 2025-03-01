import type { IHttpRequestMethods } from 'n8n-workflow';
import type { WebhookEntity } from '../databases/entities/webhook-entity';
import { WebhookRepository } from '../databases/repositories/webhook.repository';
import { CacheService } from '../services/cache/cache.service';
type Method = NonNullable<IHttpRequestMethods>;
export declare class WebhookService {
    private webhookRepository;
    private cacheService;
    constructor(webhookRepository: WebhookRepository, cacheService: CacheService);
    populateCache(): Promise<void>;
    private findCached;
    private findStaticWebhook;
    private findDynamicWebhook;
    findWebhook(method: Method, path: string): Promise<WebhookEntity | null>;
    storeWebhook(webhook: WebhookEntity): Promise<void>;
    createWebhook(data: Partial<WebhookEntity>): WebhookEntity;
    deleteWorkflowWebhooks(workflowId: string): Promise<WebhookEntity[]>;
    private deleteWebhooks;
    getWebhookMethods(path: string): Promise<IHttpRequestMethods[]>;
}
export {};
