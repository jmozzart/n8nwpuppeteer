import type express from 'express';
import { ExecutionRepository } from '../databases/repositories/execution.repository';
import type { IExecutionResponse } from '../interfaces';
import { Logger } from '../logging/logger.service';
import { NodeTypes } from '../node-types';
import type { IWebhookResponseCallbackData, IWebhookManager, WaitingWebhookRequest } from './webhook.types';
export declare class WaitingWebhooks implements IWebhookManager {
    protected readonly logger: Logger;
    protected readonly nodeTypes: NodeTypes;
    private readonly executionRepository;
    protected includeForms: boolean;
    constructor(logger: Logger, nodeTypes: NodeTypes, executionRepository: ExecutionRepository);
    protected logReceivedWebhook(method: string, executionId: string): void;
    protected disableNode(execution: IExecutionResponse, _method?: string): void;
    private isSendAndWaitRequest;
    private createWorkflow;
    protected getExecution(executionId: string): Promise<IExecutionResponse | undefined>;
    executeWebhook(req: WaitingWebhookRequest, res: express.Response): Promise<IWebhookResponseCallbackData>;
    protected getWebhookExecutionData({ execution, req, res, lastNodeExecuted, executionId, suffix, }: {
        execution: IExecutionResponse;
        req: WaitingWebhookRequest;
        res: express.Response;
        lastNodeExecuted: string;
        executionId: string;
        suffix?: string;
    }): Promise<IWebhookResponseCallbackData>;
}
