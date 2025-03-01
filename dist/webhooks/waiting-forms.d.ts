import type express from 'express';
import type { IRunData } from 'n8n-workflow';
import { Workflow } from 'n8n-workflow';
import type { IExecutionResponse } from '../interfaces';
import { WaitingWebhooks } from '../webhooks/waiting-webhooks';
import type { IWebhookResponseCallbackData, WaitingWebhookRequest } from './webhook.types';
export declare class WaitingForms extends WaitingWebhooks {
    protected includeForms: boolean;
    protected logReceivedWebhook(method: string, executionId: string): void;
    protected disableNode(execution: IExecutionResponse, method?: string): void;
    private getWorkflow;
    private reloadForm;
    findCompletionPage(workflow: Workflow, runData: IRunData, lastNodeExecuted: string): string | undefined;
    executeWebhook(req: WaitingWebhookRequest, res: express.Response): Promise<IWebhookResponseCallbackData>;
}
