import type express from 'express';
import { Workflow } from 'n8n-workflow';
import type { IWebhookData, IWorkflowExecuteAdditionalData, IHttpRequestMethods, IRunData } from 'n8n-workflow';
import type { IWorkflowDb } from '../interfaces';
import { NodeTypes } from '../node-types';
import { Push } from '../push';
import { Publisher } from '../scaling/pubsub/publisher.service';
import { OrchestrationService } from '../services/orchestration.service';
import { TestWebhookRegistrationsService } from '../webhooks/test-webhook-registrations.service';
import type { IWebhookResponseCallbackData, IWebhookManager, WebhookAccessControlOptions, WebhookRequest } from './webhook.types';
export declare class TestWebhooks implements IWebhookManager {
    private readonly push;
    private readonly nodeTypes;
    private readonly registrations;
    private readonly orchestrationService;
    private readonly publisher;
    constructor(push: Push, nodeTypes: NodeTypes, registrations: TestWebhookRegistrationsService, orchestrationService: OrchestrationService, publisher: Publisher);
    private timeouts;
    executeWebhook(request: WebhookRequest, response: express.Response): Promise<IWebhookResponseCallbackData>;
    clearTimeout(key: string): void;
    getWebhookMethods(path: string): Promise<IHttpRequestMethods[]>;
    findAccessControlOptions(path: string, httpMethod: IHttpRequestMethods): Promise<WebhookAccessControlOptions | undefined>;
    needsWebhook(userId: string, workflowEntity: IWorkflowDb, additionalData: IWorkflowExecuteAdditionalData, runData?: IRunData, pushRef?: string, destinationNode?: string): Promise<boolean>;
    cancelWebhook(workflowId: string): Promise<boolean>;
    getActiveWebhook(httpMethod: IHttpRequestMethods, path: string, webhookId?: string): Promise<IWebhookData | undefined>;
    deactivateWebhooks(workflow: Workflow): Promise<void>;
    toWorkflow(workflowEntity: IWorkflowDb): Workflow;
}
