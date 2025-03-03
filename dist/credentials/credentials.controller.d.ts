import { GlobalConfig } from '@n8n/config';
import { ProjectRelationRepository } from '../databases/repositories/project-relation.repository';
import { SharedCredentialsRepository } from '../databases/repositories/shared-credentials.repository';
import { EventService } from '../events/event.service';
import { License } from '../license';
import { Logger } from '../logging/logger.service';
import { CredentialRequest } from '../requests';
import { NamingService } from '../services/naming.service';
import { UserManagementMailer } from '../user-management/email';
import { CredentialsService } from './credentials.service';
import { EnterpriseCredentialsService } from './credentials.service.ee';
export declare class CredentialsController {
    private readonly globalConfig;
    private readonly credentialsService;
    private readonly enterpriseCredentialsService;
    private readonly namingService;
    private readonly license;
    private readonly logger;
    private readonly userManagementMailer;
    private readonly sharedCredentialsRepository;
    private readonly projectRelationRepository;
    private readonly eventService;
    constructor(globalConfig: GlobalConfig, credentialsService: CredentialsService, enterpriseCredentialsService: EnterpriseCredentialsService, namingService: NamingService, license: License, logger: Logger, userManagementMailer: UserManagementMailer, sharedCredentialsRepository: SharedCredentialsRepository, projectRelationRepository: ProjectRelationRepository, eventService: EventService);
    getMany(req: CredentialRequest.GetMany): Promise<import("../databases/entities/credentials-entity").CredentialsEntity[]>;
    getProjectCredentials(req: CredentialRequest.ForWorkflow): Promise<{
        id: string;
        name: string;
        type: string;
        scopes: import("@n8n/permissions").Scope[];
    }[]>;
    generateUniqueName(req: CredentialRequest.NewName): Promise<{
        name: string;
    }>;
    getOne(req: CredentialRequest.Get): Promise<{
        scopes: import("@n8n/permissions").Scope[];
        name: string;
        type: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    testCredentials(req: CredentialRequest.Test): Promise<import("n8n-workflow").INodeCredentialTestResult>;
    createCredentials(req: CredentialRequest.Create): Promise<{
        scopes: import("@n8n/permissions").Scope[];
        name: string;
        data: string;
        type: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateCredentials(req: CredentialRequest.Update): Promise<{
        scopes: import("@n8n/permissions").Scope[];
        name: string;
        type: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    deleteCredentials(req: CredentialRequest.Delete): Promise<boolean>;
    shareCredentials(req: CredentialRequest.Share): Promise<void>;
    transfer(req: CredentialRequest.Transfer): Promise<void>;
}
