import type { Scope } from '@n8n/permissions';
import { DataSource, Repository } from '@n8n/typeorm';
import type { EntityManager, FindManyOptions } from '@n8n/typeorm';
import { RoleService } from '../../services/role.service';
import type { Project } from '../entities/project';
import { SharedWorkflow, type WorkflowSharingRole } from '../entities/shared-workflow';
import { type User } from '../entities/user';
export declare class SharedWorkflowRepository extends Repository<SharedWorkflow> {
    private roleService;
    constructor(dataSource: DataSource, roleService: RoleService);
    getSharedWorkflowIds(workflowIds: string[]): Promise<string[]>;
    findByWorkflowIds(workflowIds: string[]): Promise<SharedWorkflow[]>;
    findSharingRole(userId: string, workflowId: string): Promise<WorkflowSharingRole | undefined>;
    makeOwnerOfAllWorkflows(project: Project): Promise<import("@n8n/typeorm").UpdateResult>;
    makeOwner(workflowIds: string[], projectId: string, trx?: EntityManager): Promise<import("@n8n/typeorm").InsertResult>;
    findWithFields(workflowIds: string[], { select }: Pick<FindManyOptions<SharedWorkflow>, 'select'>): Promise<SharedWorkflow[]>;
    deleteByIds(sharedWorkflowIds: string[], projectId: string, trx?: EntityManager): Promise<import("@n8n/typeorm").DeleteResult>;
    findWorkflowForUser(workflowId: string, user: User, scopes: Scope[], { includeTags, em }?: {
        includeTags?: boolean | undefined;
        em?: EntityManager | undefined;
    }): Promise<import("../entities/workflow-entity").WorkflowEntity | null>;
    findAllWorkflowsForUser(user: User, scopes: Scope[]): Promise<{
        projectId: string;
        name: string;
        active: boolean;
        nodes: import("n8n-workflow").INode[];
        connections: import("n8n-workflow").IConnections;
        settings?: import("n8n-workflow").IWorkflowSettings;
        staticData?: import("n8n-workflow").IDataObject;
        meta?: import("n8n-workflow").WorkflowFEMeta;
        tags?: import("../entities/tag-entity").TagEntity[];
        tagMappings: import("../entities/workflow-tag-mapping").WorkflowTagMapping[];
        shared: SharedWorkflow[];
        statistics: import("../entities/workflow-statistics").WorkflowStatistics[];
        pinData: import("../entities/workflow-entity").ISimplifiedPinData;
        versionId: string;
        triggerCount: number;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    findProjectIds(workflowId: string): Promise<string[]>;
    getWorkflowOwningProject(workflowId: string): Promise<Project | undefined>;
    getRelationsByWorkflowIdsAndProjectIds(workflowIds: string[], projectIds: string[]): Promise<SharedWorkflow[]>;
}
