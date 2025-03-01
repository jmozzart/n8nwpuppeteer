import type { User } from '../../databases/entities/user';
import type { WorkflowEntity } from '../../databases/entities/workflow-entity';
import type { WorkflowHistory } from '../../databases/entities/workflow-history';
import { SharedWorkflowRepository } from '../../databases/repositories/shared-workflow.repository';
import { WorkflowHistoryRepository } from '../../databases/repositories/workflow-history.repository';
import { Logger } from '../../logging/logger.service';
export declare class WorkflowHistoryService {
    private readonly logger;
    private readonly workflowHistoryRepository;
    private readonly sharedWorkflowRepository;
    constructor(logger: Logger, workflowHistoryRepository: WorkflowHistoryRepository, sharedWorkflowRepository: SharedWorkflowRepository);
    getList(user: User, workflowId: string, take: number, skip: number): Promise<Array<Omit<WorkflowHistory, 'nodes' | 'connections'>>>;
    getVersion(user: User, workflowId: string, versionId: string): Promise<WorkflowHistory>;
    saveVersion(user: User, workflow: WorkflowEntity, workflowId: string): Promise<void>;
}
