import { ApplicationError } from 'n8n-workflow';
export declare class TaskRunnerTimeoutError extends ApplicationError {
    description: string;
    constructor(taskTimeout: number, isSelfHosted: boolean);
}
