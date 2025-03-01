import { ApplicationError } from 'n8n-workflow';
export declare class InvalidConcurrencyLimitError extends ApplicationError {
    constructor(value: number);
}
