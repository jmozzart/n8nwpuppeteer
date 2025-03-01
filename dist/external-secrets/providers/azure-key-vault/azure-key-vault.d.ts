import type { INodeProperties } from 'n8n-workflow';
import type { SecretsProvider, SecretsProviderState } from '../../../interfaces';
import { Logger } from '../../../logging/logger.service';
import type { AzureKeyVaultContext } from './types';
export declare class AzureKeyVault implements SecretsProvider {
    private readonly logger;
    name: string;
    displayName: string;
    state: SecretsProviderState;
    properties: INodeProperties[];
    private cachedSecrets;
    private client;
    private settings;
    constructor(logger?: Logger);
    init(context: AzureKeyVaultContext): Promise<void>;
    connect(): Promise<void>;
    test(): Promise<[boolean] | [boolean, string]>;
    disconnect(): Promise<void>;
    update(): Promise<void>;
    getSecret(name: string): string;
    hasSecret(name: string): boolean;
    getSecretNames(): string[];
}
