import type { Scope } from '@n8n/permissions';
import type { ProjectRole } from '../databases/entities/project-relation';
import type { WorkflowSharingRole } from '../databases/entities/shared-workflow';
import type { User } from '../databases/entities/user';
import { ProjectRelationRepository } from '../databases/repositories/project-relation.repository';
import { SharedWorkflowRepository } from '../databases/repositories/shared-workflow.repository';
import { RoleService } from '../services/role.service';
export declare class WorkflowSharingService {
    private readonly sharedWorkflowRepository;
    private readonly roleService;
    private readonly projectRelationRepository;
    constructor(sharedWorkflowRepository: SharedWorkflowRepository, roleService: RoleService, projectRelationRepository: ProjectRelationRepository);
    getSharedWorkflowIds(user: User, options: {
        scopes: Scope[];
        projectId?: string;
    } | {
        projectRoles: ProjectRole[];
        workflowRoles: WorkflowSharingRole[];
        projectId?: string;
    }): Promise<string[]>;
    getSharedWorkflowScopes(workflowIds: string[], user: User): Promise<Array<[string, Scope[]]>>;
}
