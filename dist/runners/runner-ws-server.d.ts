import { TaskRunnersConfig } from '@n8n/config';
import type { BrokerMessage } from '@n8n/task-runner';
import type WebSocket from 'ws';
import { Logger } from '../logging/logger.service';
import { DefaultTaskRunnerDisconnectAnalyzer } from './default-task-runner-disconnect-analyzer';
import { RunnerLifecycleEvents } from './runner-lifecycle-events';
import type { DisconnectAnalyzer, DisconnectReason, TaskRunnerServerInitRequest, TaskRunnerServerInitResponse } from './runner-types';
import { TaskBroker, type TaskRunner } from './task-broker.service';
declare const enum WsStatusCode {
    CloseNormal = 1000,
    CloseGoingAway = 1001,
    CloseProtocolError = 1002,
    CloseUnsupportedData = 1003,
    CloseNoStatus = 1005,
    CloseAbnormal = 1006,
    CloseInvalidData = 1007
}
export declare class TaskRunnerWsServer {
    private readonly logger;
    private readonly taskBroker;
    private disconnectAnalyzer;
    private readonly taskTunnersConfig;
    private readonly runnerLifecycleEvents;
    runnerConnections: Map<TaskRunner['id'], WebSocket>;
    private heartbeatTimer;
    constructor(logger: Logger, taskBroker: TaskBroker, disconnectAnalyzer: DefaultTaskRunnerDisconnectAnalyzer, taskTunnersConfig: TaskRunnersConfig, runnerLifecycleEvents: RunnerLifecycleEvents);
    start(): void;
    private startHeartbeatChecks;
    stop(): Promise<void>;
    setDisconnectAnalyzer(disconnectAnalyzer: DisconnectAnalyzer): void;
    getDisconnectAnalyzer(): DefaultTaskRunnerDisconnectAnalyzer;
    sendMessage(id: TaskRunner['id'], message: BrokerMessage.ToRunner.All): void;
    add(id: TaskRunner['id'], connection: WebSocket): void;
    removeConnection(id: TaskRunner['id'], reason?: DisconnectReason, code?: WsStatusCode): Promise<void>;
    handleRequest(req: TaskRunnerServerInitRequest, _res: TaskRunnerServerInitResponse): void;
    private stopConnectedRunners;
}
export {};
