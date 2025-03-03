import type { Scope } from '@n8n/permissions';
import type { EntityManager, FindOptionsRelations } from '@n8n/typeorm';
import { DataSource, Repository } from '@n8n/typeorm';
import { RoleService } from '../../services/role.service';
import type { Project } from '../entities/project';
import type { ProjectRole } from '../entities/project-relation';
import { type CredentialSharingRole, SharedCredentials } from '../entities/shared-credentials';
import type { User } from '../entities/user';
export declare class SharedCredentialsRepository extends Repository<SharedCredentials> {
    private readonly roleService;
    constructor(dataSource: DataSource, roleService: RoleService);
    findCredentialForUser(credentialsId: string, user: User, scopes: Scope[], _relations?: FindOptionsRelations<SharedCredentials>): Promise<import("../entities/credentials-entity").CredentialsEntity | null>;
    findByCredentialIds(credentialIds: string[], role: CredentialSharingRole): Promise<SharedCredentials[]>;
    makeOwnerOfAllCredentials(project: Project): Promise<import("@n8n/typeorm").UpdateResult>;
    makeOwner(credentialIds: string[], projectId: string, trx?: EntityManager): Promise<import("@n8n/typeorm").InsertResult>;
    getCredentialIdsByUserAndRole(userIds: string[], options: {
        scopes: Scope[];
    } | {
        projectRoles: ProjectRole[];
        credentialRoles: CredentialSharingRole[];
    }): Promise<string[]>;
    deleteByIds(sharedCredentialsIds: string[], projectId: string, trx?: EntityManager): Promise<import("@n8n/typeorm").DeleteResult>;
    getFilteredAccessibleCredentials(projectIds: string[], credentialsIds: string[]): Promise<string[]>;
    findCredentialOwningProject(credentialsId: string): Promise<Project | undefined>;
    getAllRelationsForCredentials(credentialIds: string[]): Promise<SharedCredentials[]>;
}
