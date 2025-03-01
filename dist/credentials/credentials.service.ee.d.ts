import { type EntityManager } from '@n8n/typeorm';
import type { ICredentialDataDecryptedObject } from 'n8n-workflow';
import type { CredentialsEntity } from '../databases/entities/credentials-entity';
import { SharedCredentials } from '../databases/entities/shared-credentials';
import type { User } from '../databases/entities/user';
import { SharedCredentialsRepository } from '../databases/repositories/shared-credentials.repository';
import { OwnershipService } from '../services/ownership.service';
import { ProjectService } from '../services/project.service';
import { RoleService } from '../services/role.service';
import { CredentialsService } from './credentials.service';
export declare class EnterpriseCredentialsService {
    private readonly sharedCredentialsRepository;
    private readonly ownershipService;
    private readonly credentialsService;
    private readonly projectService;
    private readonly roleService;
    constructor(sharedCredentialsRepository: SharedCredentialsRepository, ownershipService: OwnershipService, credentialsService: CredentialsService, projectService: ProjectService, roleService: RoleService);
    shareWithProjects(user: User, credential: CredentialsEntity, shareWithIds: string[], entityManager?: EntityManager): Promise<SharedCredentials[]>;
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
    transferOne(user: User, credentialId: string, destinationProjectId: string): Promise<void>;
}
