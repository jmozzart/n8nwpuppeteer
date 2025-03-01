import { GlobalConfig } from '@n8n/config';
import type { ICredentialDataDecryptedObject } from 'n8n-workflow';
import { CredentialTypes } from './credential-types';
import type { ICredentialsOverwrite } from './interfaces';
import { Logger } from './logging/logger.service';
export declare class CredentialsOverwrites {
    private readonly credentialTypes;
    private readonly logger;
    private overwriteData;
    private resolvedTypes;
    constructor(globalConfig: GlobalConfig, credentialTypes: CredentialTypes, logger: Logger);
    setData(overwriteData: ICredentialsOverwrite): void;
    applyOverwrite(type: string, data: ICredentialDataDecryptedObject): ICredentialDataDecryptedObject;
    private getOverwrites;
    private get;
    getAll(): ICredentialsOverwrite;
}
