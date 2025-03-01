import type { INodeProperties } from 'n8n-workflow';
import type { SecretsProvider, SecretsProviderState } from '../../../interfaces';
import { Logger } from '../../../logging/logger.service';
import type { AwsSecretsManagerContext } from './types';
export declare class AwsSecretsManager implements SecretsProvider {
    private readonly logger;
    name: string;
    displayName: string;
    state: SecretsProviderState;
    properties: INodeProperties[];
    private cachedSecrets;
    private client;
    constructor(logger?: Logger);
    init(context: AwsSecretsManagerContext): Promise<void>;
    test(): Promise<[boolean] | [boolean, string]>;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    update(): Promise<void>;
    getSecret(name: string): string;
    hasSecret(name: string): boolean;
    getSecretNames(): string[];
    private assertAuthType;
}
