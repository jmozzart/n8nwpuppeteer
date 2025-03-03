import { GlobalConfig } from '@n8n/config';
import express from 'express';
import type { Server } from 'http';
import { ExternalHooks } from './external-hooks';
import { Logger } from './logging/logger.service';
export declare abstract class AbstractServer {
    protected logger: Logger;
    protected server: Server;
    readonly app: express.Application;
    protected externalHooks: ExternalHooks;
    protected globalConfig: GlobalConfig;
    protected sslKey: string;
    protected sslCert: string;
    protected restEndpoint: string;
    protected endpointForm: string;
    protected endpointFormTest: string;
    protected endpointFormWaiting: string;
    protected endpointWebhook: string;
    protected endpointWebhookTest: string;
    protected endpointWebhookWaiting: string;
    protected webhooksEnabled: boolean;
    protected testWebhooksEnabled: boolean;
    readonly uniqueInstanceId: string;
    constructor();
    configure(): Promise<void>;
    private setupErrorHandlers;
    private setupCommonMiddlewares;
    private setupDevMiddlewares;
    protected setupPushServer(): void;
    private setupHealthCheck;
    init(): Promise<void>;
    start(): Promise<void>;
    onShutdown(): Promise<void>;
}
