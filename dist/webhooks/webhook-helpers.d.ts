import type express from 'express';
import type { INode, IRunExecutionData, IWebhookData, IWorkflowExecuteAdditionalData, Workflow, WorkflowExecuteMode } from 'n8n-workflow';
import type { IWorkflowDb } from '../interfaces';
import type { IWebhookResponseCallbackData, WebhookRequest } from './webhook.types';
export declare function getWorkflowWebhooks(workflow: Workflow, additionalData: IWorkflowExecuteAdditionalData, destinationNode?: string, ignoreRestartWebhooks?: boolean): IWebhookData[];
export declare function executeWebhook(workflow: Workflow, webhookData: IWebhookData, workflowData: IWorkflowDb, workflowStartNode: INode, executionMode: WorkflowExecuteMode, pushRef: string | undefined, runExecutionData: IRunExecutionData | undefined, executionId: string | undefined, req: WebhookRequest, res: express.Response, responseCallback: (error: Error | null, data: IWebhookResponseCallbackData) => void, destinationNode?: string): Promise<string | undefined>;
