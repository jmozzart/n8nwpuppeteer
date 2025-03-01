import { TaskRunnersConfig } from '@n8n/config';
export declare class TaskRunnerModule {
    private readonly runnerConfig;
    private taskRunnerHttpServer;
    private taskRunnerWsServer;
    private taskManager;
    private taskRunnerProcess;
    constructor(runnerConfig: TaskRunnersConfig);
    start(): Promise<void>;
    stop(): Promise<void>;
    private loadTaskManager;
    private loadTaskRunnerServer;
    private startInternalTaskRunner;
}
