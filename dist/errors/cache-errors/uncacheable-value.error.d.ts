import { ApplicationError } from 'n8n-workflow';
export declare class UncacheableValueError extends ApplicationError {
    constructor(key: string);
}
