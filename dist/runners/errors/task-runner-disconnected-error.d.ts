import { ApplicationError } from 'n8n-workflow';
export declare class TaskRunnerDisconnectedError extends ApplicationError {
    constructor(runnerId: string);
}
