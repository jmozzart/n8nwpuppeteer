import type { ValidationError } from 'class-validator';
import { Cipher, InstanceSettings } from 'n8n-core';
import { Logger } from '../../logging/logger.service';
import type { KeyPairType } from './types/key-pair-type';
import { SourceControlPreferences } from './types/source-control-preferences';
export declare class SourceControlPreferencesService {
    private readonly instanceSettings;
    private readonly logger;
    private readonly cipher;
    private _sourceControlPreferences;
    readonly sshKeyName: string;
    readonly sshFolder: string;
    readonly gitFolder: string;
    constructor(instanceSettings: InstanceSettings, logger: Logger, cipher: Cipher);
    get sourceControlPreferences(): SourceControlPreferences;
    set sourceControlPreferences(preferences: Partial<SourceControlPreferences>);
    isSourceControlSetup(): string | false;
    private getKeyPairFromDatabase;
    private getPrivateKeyFromDatabase;
    private getPublicKeyFromDatabase;
    getPrivateKeyPath(): Promise<string>;
    getPublicKey(): Promise<string>;
    deleteKeyPair(): Promise<void>;
    generateAndSaveKeyPair(keyPairType?: KeyPairType): Promise<SourceControlPreferences>;
    isBranchReadOnly(): boolean;
    isSourceControlConnected(): boolean;
    isSourceControlLicensedAndEnabled(): boolean;
    getBranchName(): string;
    getPreferences(): SourceControlPreferences;
    validateSourceControlPreferences(preferences: Partial<SourceControlPreferences>, allowMissingProperties?: boolean): Promise<ValidationError[]>;
    setPreferences(preferences: Partial<SourceControlPreferences>, saveToDb?: boolean): Promise<SourceControlPreferences>;
    loadFromDbAndApplySourceControlPreferences(): Promise<SourceControlPreferences | undefined>;
}
