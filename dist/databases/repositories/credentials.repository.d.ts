import type { Scope } from '@n8n/permissions';
import { DataSource, Repository } from '@n8n/typeorm';
import type { ListQuery } from '../../requests';
import { RoleService } from '../../services/role.service';
import { CredentialsEntity } from '../entities/credentials-entity';
import type { User } from '../entities/user';
export declare class CredentialsRepository extends Repository<CredentialsEntity> {
    readonly roleService: RoleService;
    constructor(dataSource: DataSource, roleService: RoleService);
    findStartingWith(credentialName: string): Promise<CredentialsEntity[]>;
    findMany(listQueryOptions?: ListQuery.Options, credentialIds?: string[]): Promise<CredentialsEntity[]>;
    private toFindManyOptions;
    getManyByIds(ids: string[], { withSharings }?: {
        withSharings: boolean;
    }): Promise<CredentialsEntity[]>;
    findAllPersonalCredentials(): Promise<CredentialsEntity[]>;
    findAllCredentialsForWorkflow(workflowId: string): Promise<CredentialsEntity[]>;
    findAllCredentialsForProject(projectId: string): Promise<CredentialsEntity[]>;
    findCredentialsForUser(user: User, scopes: Scope[]): Promise<CredentialsEntity[]>;
}
