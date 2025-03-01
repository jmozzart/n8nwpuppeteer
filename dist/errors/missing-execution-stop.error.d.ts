import { ApplicationError } from 'n8n-workflow';
export declare class MissingExecutionStopError extends ApplicationError {
    constructor(executionId: string);
}
