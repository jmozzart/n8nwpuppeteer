import { ApplicationError } from 'n8n-workflow';
export declare class UnknownAuthTypeError extends ApplicationError {
    constructor(authType: string);
}
