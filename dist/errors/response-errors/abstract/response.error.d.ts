import { ApplicationError } from 'n8n-workflow';
export declare abstract class ResponseError extends ApplicationError {
    readonly httpStatusCode: number;
    readonly errorCode: number;
    readonly hint: string | undefined;
    constructor(message: string, httpStatusCode: number, errorCode?: number, hint?: string | undefined);
}
