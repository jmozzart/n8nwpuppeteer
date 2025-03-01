import { ApplicationError } from 'n8n-workflow';
export declare class CredentialNotFoundError extends ApplicationError {
    constructor(credentialId: string, credentialType: string);
}
