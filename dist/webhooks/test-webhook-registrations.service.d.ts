import type { IWebhookData } from 'n8n-workflow';
import type { IWorkflowDb } from '../interfaces';
import { CacheService } from '../services/cache/cache.service';
import { OrchestrationService } from '../services/orchestration.service';
export type TestWebhookRegistration = {
    pushRef?: string;
    workflowEntity: IWorkflowDb;
    destinationNode?: string;
    webhook: IWebhookData;
};
export declare class TestWebhookRegistrationsService {
    private readonly cacheService;
    private readonly orchestrationService;
    constructor(cacheService: CacheService, orchestrationService: OrchestrationService);
    private readonly cacheKey;
    register(registration: TestWebhookRegistration): Promise<void>;
    deregister(arg: IWebhookData | string): Promise<void>;
    get(key: string): Promise<TestWebhookRegistration | undefined>;
    getAllKeys(): Promise<string[]>;
    getAllRegistrations(): Promise<TestWebhookRegistration[]>;
    deregisterAll(): Promise<void>;
    toKey(webhook: Pick<IWebhookData, 'webhookId' | 'httpMethod' | 'path'>): string;
}
