import { TaskRunnersConfig } from '@n8n/config';
import { DefaultTaskRunnerDisconnectAnalyzer } from './default-task-runner-disconnect-analyzer';
import type { DisconnectErrorOptions } from './runner-types';
import { TaskRunnerProcess } from './task-runner-process';
export declare class InternalTaskRunnerDisconnectAnalyzer extends DefaultTaskRunnerDisconnectAnalyzer {
    private readonly runnerConfig;
    private readonly taskRunnerProcess;
    private get isCloudDeployment();
    private readonly exitReasonSignal;
    constructor(runnerConfig: TaskRunnersConfig, taskRunnerProcess: TaskRunnerProcess);
    toDisconnectError(opts: DisconnectErrorOptions): Promise<Error>;
    private awaitExitSignal;
}
