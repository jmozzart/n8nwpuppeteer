import { GlobalConfig } from '@n8n/config';
import { DataSource, Repository, type UpdateResult, type FindOptionsWhere, type FindOptionsRelations } from '@n8n/typeorm';
import type { ListQuery } from '../../requests';
import { WorkflowEntity } from '../entities/workflow-entity';
export declare class WorkflowRepository extends Repository<WorkflowEntity> {
    private readonly globalConfig;
    constructor(dataSource: DataSource, globalConfig: GlobalConfig);
    get(where: FindOptionsWhere<WorkflowEntity>, options?: {
        relations: string[] | FindOptionsRelations<WorkflowEntity>;
    }): Promise<WorkflowEntity | null>;
    getAllActive(): Promise<WorkflowEntity[]>;
    getActiveIds(): Promise<string[]>;
    findById(workflowId: string): Promise<WorkflowEntity | null>;
    findByIds(workflowIds: string[], { fields }?: {
        fields?: string[];
    }): Promise<WorkflowEntity[]>;
    getActiveTriggerCount(): Promise<number>;
    updateWorkflowTriggerCount(id: string, triggerCount: number): Promise<UpdateResult>;
    getMany(sharedWorkflowIds: string[], options?: ListQuery.Options): Promise<{
        workflows: (Pick<WorkflowEntity, "id"> & Partial<Pick<WorkflowEntity, "tags" | "createdAt" | "updatedAt" | "name" | "versionId" | "active">>)[] | ListQuery.Workflow.WithSharing[];
        count: number;
    }>;
    findStartingWith(workflowName: string): Promise<Array<{
        name: string;
    }>>;
    findIn(workflowIds: string[]): Promise<WorkflowEntity[]>;
    findWebhookBasedActiveWorkflows(): Promise<{
        id: string;
        name: string;
    }[]>;
    updateActiveState(workflowId: string, newState: boolean): Promise<UpdateResult>;
    deactivateAll(): Promise<UpdateResult>;
    activateAll(): Promise<UpdateResult>;
    findByActiveState(activeState: boolean): Promise<WorkflowEntity[]>;
}
