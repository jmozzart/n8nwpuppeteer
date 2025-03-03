import { GlobalConfig } from '@n8n/config';
import type { Response } from 'express';
import type { ICredentialDataDecryptedObject, IWorkflowExecuteAdditionalData } from 'n8n-workflow';
import { CredentialsHelper } from '../../credentials-helper';
import type { CredentialsEntity } from '../../databases/entities/credentials-entity';
import { CredentialsRepository } from '../../databases/repositories/credentials.repository';
import { SharedCredentialsRepository } from '../../databases/repositories/shared-credentials.repository';
import { ExternalHooks } from '../../external-hooks';
import type { ICredentialsDb } from '../../interfaces';
import { Logger } from '../../logging/logger.service';
import type { AuthenticatedRequest, OAuthRequest } from '../../requests';
import { UrlService } from '../../services/url.service';
type CsrfStateParam = {
    cid: string;
    token: string;
    createdAt: number;
    userId?: string;
};
export declare const skipAuthOnOAuthCallback: boolean;
export declare abstract class AbstractOAuthController {
    protected readonly logger: Logger;
    protected readonly externalHooks: ExternalHooks;
    private readonly credentialsHelper;
    private readonly credentialsRepository;
    private readonly sharedCredentialsRepository;
    private readonly urlService;
    private readonly globalConfig;
    abstract oauthVersion: number;
    constructor(logger: Logger, externalHooks: ExternalHooks, credentialsHelper: CredentialsHelper, credentialsRepository: CredentialsRepository, sharedCredentialsRepository: SharedCredentialsRepository, urlService: UrlService, globalConfig: GlobalConfig);
    get baseUrl(): string;
    protected getCredential(req: OAuthRequest.OAuth2Credential.Auth): Promise<CredentialsEntity>;
    protected getAdditionalData(): Promise<IWorkflowExecuteAdditionalData>;
    protected getDecryptedData(credential: ICredentialsDb, additionalData: IWorkflowExecuteAdditionalData): Promise<ICredentialDataDecryptedObject>;
    protected applyDefaultsAndOverwrites<T>(credential: ICredentialsDb, decryptedData: ICredentialDataDecryptedObject, additionalData: IWorkflowExecuteAdditionalData): T;
    protected encryptAndSaveData(credential: ICredentialsDb, decryptedData: ICredentialDataDecryptedObject): Promise<void>;
    protected getCredentialWithoutUser(credentialId: string): Promise<ICredentialsDb | null>;
    createCsrfState(credentialsId: string, userId?: string): [string, string];
    protected decodeCsrfState(encodedState: string, req: AuthenticatedRequest): CsrfStateParam;
    protected verifyCsrfState(decrypted: ICredentialDataDecryptedObject & {
        csrfSecret?: string;
    }, state: CsrfStateParam): boolean;
    protected resolveCredential<T>(req: OAuthRequest.OAuth1Credential.Callback | OAuthRequest.OAuth2Credential.Callback): Promise<[ICredentialsDb, ICredentialDataDecryptedObject, T]>;
    protected renderCallbackError(res: Response, message: string, reason?: string): void;
}
export {};
