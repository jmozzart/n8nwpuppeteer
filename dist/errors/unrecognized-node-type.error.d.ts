import { ApplicationError } from 'n8n-workflow';
export declare class UnrecognizedNodeTypeError extends ApplicationError {
    severity: string;
    constructor(nodeType: string);
}
