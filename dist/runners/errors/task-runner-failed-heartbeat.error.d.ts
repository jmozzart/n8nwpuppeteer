import { ApplicationError } from 'n8n-workflow';
export declare class TaskRunnerFailedHeartbeatError extends ApplicationError {
    description: string;
    constructor(heartbeatInterval: number, isSelfHosted: boolean);
}
