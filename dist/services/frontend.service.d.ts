import type { FrontendSettings } from '@n8n/api-types';
import { GlobalConfig, FrontendConfig, SecurityConfig } from '@n8n/config';
import { InstanceSettings } from 'n8n-core';
import { CredentialTypes } from '../credential-types';
import { CredentialsOverwrites } from '../credentials-overwrites';
import { License } from '../license';
import { LoadNodesAndCredentials } from '../load-nodes-and-credentials';
import { Logger } from '../logging/logger.service';
import { UserManagementMailer } from '../user-management/email';
import { UrlService } from './url.service';
export declare class FrontendService {
    private readonly globalConfig;
    private readonly logger;
    private readonly loadNodesAndCredentials;
    private readonly credentialTypes;
    private readonly credentialsOverwrites;
    private readonly license;
    private readonly mailer;
    private readonly instanceSettings;
    private readonly urlService;
    private readonly securityConfig;
    private readonly frontendConfig;
    settings: FrontendSettings;
    private communityPackagesService?;
    constructor(globalConfig: GlobalConfig, logger: Logger, loadNodesAndCredentials: LoadNodesAndCredentials, credentialTypes: CredentialTypes, credentialsOverwrites: CredentialsOverwrites, license: License, mailer: UserManagementMailer, instanceSettings: InstanceSettings, urlService: UrlService, securityConfig: SecurityConfig, frontendConfig: FrontendConfig);
    private initSettings;
    generateTypes(): Promise<void>;
    getSettings(): FrontendSettings;
    private writeStaticJSON;
    private overwriteCredentialsProperties;
    private isDocker;
}
