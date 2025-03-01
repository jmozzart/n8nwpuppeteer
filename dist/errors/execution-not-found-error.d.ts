import { ApplicationError } from 'n8n-workflow';
export declare class ExecutionNotFoundError extends ApplicationError {
    constructor(executionId: string);
}
