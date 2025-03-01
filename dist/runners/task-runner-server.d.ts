import { GlobalConfig } from '@n8n/config';
import express from 'express';
import { Logger } from '../logging/logger.service';
import { TaskRunnerAuthController } from '../runners/auth/task-runner-auth.controller';
import { TaskRunnerWsServer } from '../runners/runner-ws-server';
export declare class TaskRunnerServer {
    private readonly logger;
    private readonly globalConfig;
    private readonly taskRunnerAuthController;
    private readonly taskRunnerWsServer;
    private server;
    private wsServer;
    readonly app: express.Application;
    get port(): number;
    private get upgradeEndpoint();
    constructor(logger: Logger, globalConfig: GlobalConfig, taskRunnerAuthController: TaskRunnerAuthController, taskRunnerWsServer: TaskRunnerWsServer);
    start(): Promise<void>;
    stop(): Promise<void>;
    private setupHttpServer;
    private setupWsServer;
    private setupErrorHandlers;
    private setupCommonMiddlewares;
    private configureRoutes;
    private handleUpgradeRequest;
    private getEndpointBasePath;
}
