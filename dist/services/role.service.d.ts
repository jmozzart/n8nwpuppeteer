import { type Resource, type Scope } from '@n8n/permissions';
import type { CredentialsEntity } from '../databases/entities/credentials-entity';
import type { ProjectRelation, ProjectRole } from '../databases/entities/project-relation';
import type { CredentialSharingRole, SharedCredentials } from '../databases/entities/shared-credentials';
import type { SharedWorkflow, WorkflowSharingRole } from '../databases/entities/shared-workflow';
import type { GlobalRole, User } from '../databases/entities/user';
import { License } from '../license';
import type { ListQuery } from '../requests';
export type RoleNamespace = 'global' | 'project' | 'credential' | 'workflow';
export interface RoleMap {
    global: GlobalRole[];
    project: ProjectRole[];
    credential: CredentialSharingRole[];
    workflow: WorkflowSharingRole[];
}
export type AllRoleTypes = GlobalRole | ProjectRole | WorkflowSharingRole | CredentialSharingRole;
export type ScopesField = {
    scopes: Scope[];
};
export declare class RoleService {
    private readonly license;
    constructor(license: License);
    rolesWithScope(namespace: 'global', scopes: Scope | Scope[]): GlobalRole[];
    rolesWithScope(namespace: 'project', scopes: Scope | Scope[]): ProjectRole[];
    rolesWithScope(namespace: 'credential', scopes: Scope | Scope[]): CredentialSharingRole[];
    rolesWithScope(namespace: 'workflow', scopes: Scope | Scope[]): WorkflowSharingRole[];
    getRoles(): RoleMap;
    getRoleName(role: AllRoleTypes): string;
    getRoleScopes(role: GlobalRole | ProjectRole | WorkflowSharingRole | CredentialSharingRole, filters?: Resource[]): Scope[];
    getScopesBy(projectRoles: Set<ProjectRole>): Set<Scope>;
    addScopes(rawWorkflow: ListQuery.Workflow.WithSharing | ListQuery.Workflow.WithOwnedByAndSharedWith, user: User, userProjectRelations: ProjectRelation[]): ListQuery.Workflow.WithScopes;
    addScopes(rawCredential: CredentialsEntity, user: User, userProjectRelations: ProjectRelation[]): CredentialsEntity & ScopesField;
    addScopes(rawCredential: ListQuery.Credentials.WithSharing | ListQuery.Credentials.WithOwnedByAndSharedWith, user: User, userProjectRelations: ProjectRelation[]): ListQuery.Credentials.WithScopes;
    combineResourceScopes(type: 'workflow' | 'credential', user: User, shared: SharedCredentials[] | SharedWorkflow[], userProjectRelations: ProjectRelation[]): Scope[];
    isRoleLicensed(role: AllRoleTypes): boolean;
}
