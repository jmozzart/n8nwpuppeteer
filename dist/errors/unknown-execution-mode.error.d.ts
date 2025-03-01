import { ApplicationError } from 'n8n-workflow';
export declare class UnknownExecutionModeError extends ApplicationError {
    constructor(mode: string);
}
