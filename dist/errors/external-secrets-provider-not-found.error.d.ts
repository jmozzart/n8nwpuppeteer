import { ApplicationError } from 'n8n-workflow';
export declare class ExternalSecretsProviderNotFoundError extends ApplicationError {
    providerName: string;
    constructor(providerName: string);
}
