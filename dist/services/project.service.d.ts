import { type Scope } from '@n8n/permissions';
import type { EntityManager } from '@n8n/typeorm';
import { ApplicationError } from 'n8n-workflow';
import { Project, type ProjectType } from '../databases/entities/project';
import { ProjectRelation } from '../databases/entities/project-relation';
import type { ProjectRole } from '../databases/entities/project-relation';
import type { User } from '../databases/entities/user';
import { ProjectRelationRepository } from '../databases/repositories/project-relation.repository';
import { ProjectRepository } from '../databases/repositories/project.repository';
import { SharedCredentialsRepository } from '../databases/repositories/shared-credentials.repository';
import { SharedWorkflowRepository } from '../databases/repositories/shared-workflow.repository';
import { License } from '../license';
import { CacheService } from './cache/cache.service';
import { RoleService } from './role.service';
export declare class TeamProjectOverQuotaError extends ApplicationError {
    constructor(limit: number);
}
export declare class UnlicensedProjectRoleError extends ApplicationError {
    constructor(role: ProjectRole);
}
export declare class ProjectService {
    private readonly sharedWorkflowRepository;
    private readonly projectRepository;
    private readonly projectRelationRepository;
    private readonly roleService;
    private readonly sharedCredentialsRepository;
    private readonly cacheService;
    private readonly license;
    constructor(sharedWorkflowRepository: SharedWorkflowRepository, projectRepository: ProjectRepository, projectRelationRepository: ProjectRelationRepository, roleService: RoleService, sharedCredentialsRepository: SharedCredentialsRepository, cacheService: CacheService, license: License);
    private get workflowService();
    private get credentialsService();
    deleteProject(user: User, projectId: string, { migrateToProject }?: {
        migrateToProject?: string;
    }): Promise<void>;
    findProjectsWorkflowIsIn(workflowId: string): Promise<string[]>;
    getAccessibleProjects(user: User): Promise<Project[]>;
    getPersonalProjectOwners(projectIds: string[]): Promise<ProjectRelation[]>;
    createTeamProject(name: string, adminUser: User, id?: string): Promise<Project>;
    updateProject(name: string, projectId: string): Promise<Project>;
    getPersonalProject(user: User): Promise<Project | null>;
    getProjectRelationsForUser(user: User): Promise<ProjectRelation[]>;
    syncProjectRelations(projectId: string, relations: Array<{
        userId: string;
        role: ProjectRole;
    }>): Promise<void>;
    clearCredentialCanUseExternalSecretsCache(projectId: string): Promise<void>;
    pruneRelations(em: EntityManager, project: Project): Promise<void>;
    addManyRelations(em: EntityManager, project: Project, relations: Array<{
        userId: string;
        role: ProjectRole;
    }>): Promise<void>;
    getProjectWithScope(user: User, projectId: string, scopes: Scope[], entityManager?: EntityManager): Promise<Project | null>;
    addUser(projectId: string, userId: string, role: ProjectRole): Promise<{
        projectId: string;
        userId: string;
        role: ProjectRole;
    } & ProjectRelation>;
    getProject(projectId: string): Promise<Project>;
    getProjectRelations(projectId: string): Promise<ProjectRelation[]>;
    getUserOwnedOrAdminProjects(userId: string): Promise<Project[]>;
    getProjectCounts(): Promise<Record<ProjectType, number>>;
}
