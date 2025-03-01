import type { Scope } from '@n8n/permissions';
import { type EntityManager, type FindOptionsRelations } from '@n8n/typeorm';
import type { ICredentialDataDecryptedObject, ICredentialsDecrypted } from 'n8n-workflow';
import { CredentialTypes } from '../credential-types';
import { CredentialsEntity } from '../databases/entities/credentials-entity';
import { SharedCredentials } from '../databases/entities/shared-credentials';
import type { User } from '../databases/entities/user';
import { CredentialsRepository } from '../databases/repositories/credentials.repository';
import { ProjectRepository } from '../databases/repositories/project.repository';
import { SharedCredentialsRepository } from '../databases/repositories/shared-credentials.repository';
import { UserRepository } from '../databases/repositories/user.repository';
import { ExternalHooks } from '../external-hooks';
import type { ICredentialsDb } from '../interfaces';
import { Logger } from '../logging/logger.service';
import type { CredentialRequest, ListQuery } from '../requests';
import { CredentialsTester } from '../services/credentials-tester.service';
import { OwnershipService } from '../services/ownership.service';
import { ProjectService } from '../services/project.service';
import { RoleService } from '../services/role.service';
export type CredentialsGetSharedOptions = {
    allowGlobalScope: true;
    globalScope: Scope;
} | {
    allowGlobalScope: false;
};
export declare class CredentialsService {
    private readonly credentialsRepository;
    private readonly sharedCredentialsRepository;
    private readonly ownershipService;
    private readonly logger;
    private readonly credentialsTester;
    private readonly externalHooks;
    private readonly credentialTypes;
    private readonly projectRepository;
    private readonly projectService;
    private readonly roleService;
    private readonly userRepository;
    constructor(credentialsRepository: CredentialsRepository, sharedCredentialsRepository: SharedCredentialsRepository, ownershipService: OwnershipService, logger: Logger, credentialsTester: CredentialsTester, externalHooks: ExternalHooks, credentialTypes: CredentialTypes, projectRepository: ProjectRepository, projectService: ProjectService, roleService: RoleService, userRepository: UserRepository);
    getMany(user: User, options?: {
        listQueryOptions?: ListQuery.Options;
        includeScopes?: string;
    }): Promise<CredentialsEntity[]>;
    getCredentialsAUserCanUseInAWorkflow(user: User, options: {
        workflowId: string;
    } | {
        projectId: string;
    }): Promise<{
        id: string;
        name: string;
        type: string;
        scopes: Scope[];
    }[]>;
    findAllCredentialIdsForWorkflow(workflowId: string): Promise<CredentialsEntity[]>;
    findAllCredentialIdsForProject(projectId: string): Promise<CredentialsEntity[]>;
    getSharing(user: User, credentialId: string, globalScopes: Scope[], relations?: FindOptionsRelations<SharedCredentials>): Promise<SharedCredentials | null>;
    prepareCreateData(data: CredentialRequest.CredentialProperties): Promise<CredentialsEntity>;
    prepareUpdateData(data: CredentialRequest.CredentialProperties, decryptedData: ICredentialDataDecryptedObject): Promise<CredentialsEntity>;
    createEncryptedData(credentialId: string | null, data: CredentialsEntity): ICredentialsDb;
    decrypt(credential: CredentialsEntity): ICredentialDataDecryptedObject;
    update(credentialId: string, newCredentialData: ICredentialsDb): Promise<CredentialsEntity | null>;
    save(credential: CredentialsEntity, encryptedData: ICredentialsDb, user: User, projectId?: string): Promise<CredentialsEntity>;
    delete(credentials: CredentialsEntity): Promise<void>;
    test(user: User, credentials: ICredentialsDecrypted): Promise<import("n8n-workflow").INodeCredentialTestResult>;
    redact(data: ICredentialDataDecryptedObject, credential: CredentialsEntity): ICredentialDataDecryptedObject;
    private unredactRestoreValues;
    unredact(redactedData: ICredentialDataDecryptedObject, savedData: ICredentialDataDecryptedObject): ICredentialDataDecryptedObject;
    getOne(user: User, credentialId: string, includeDecryptedData: boolean): Promise<{
        name: string;
        type: string;
        shared: SharedCredentials[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        data: ICredentialDataDecryptedObject;
    } | {
        name: string;
        type: string;
        shared: SharedCredentials[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getCredentialScopes(user: User, credentialId: string): Promise<Scope[]>;
    transferAll(fromProjectId: string, toProjectId: string, trx?: EntityManager): Promise<void>;
    replaceCredentialContentsForSharee(user: User, credential: CredentialsEntity, decryptedData: ICredentialDataDecryptedObject, mergedCredentials: ICredentialsDecrypted): Promise<void>;
}
