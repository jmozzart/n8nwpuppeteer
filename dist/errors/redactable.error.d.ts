import { ApplicationError } from 'n8n-workflow';
export declare class RedactableError extends ApplicationError {
    constructor(fieldName: string, args: string);
}
