import { type EntityManager } from '@n8n/typeorm';
import { ActiveWorkflowManager } from '../active-workflow-manager';
import { CredentialsService } from '../credentials/credentials.service';
import type { CredentialsEntity } from '../databases/entities/credentials-entity';
import { SharedWorkflow } from '../databases/entities/shared-workflow';
import type { User } from '../databases/entities/user';
import type { WorkflowEntity } from '../databases/entities/workflow-entity';
import { CredentialsRepository } from '../databases/repositories/credentials.repository';
import { SharedWorkflowRepository } from '../databases/repositories/shared-workflow.repository';
import { WorkflowRepository } from '../databases/repositories/workflow.repository';
import { Logger } from '../logging/logger.service';
import { OwnershipService } from '../services/ownership.service';
import { ProjectService } from '../services/project.service';
import type { WorkflowWithSharingsAndCredentials, WorkflowWithSharingsMetaDataAndCredentials } from './workflows.types';
export declare class EnterpriseWorkflowService {
    private readonly logger;
    private readonly sharedWorkflowRepository;
    private readonly workflowRepository;
    private readonly credentialsRepository;
    private readonly credentialsService;
    private readonly ownershipService;
    private readonly projectService;
    private readonly activeWorkflowManager;
    constructor(logger: Logger, sharedWorkflowRepository: SharedWorkflowRepository, workflowRepository: WorkflowRepository, credentialsRepository: CredentialsRepository, credentialsService: CredentialsService, ownershipService: OwnershipService, projectService: ProjectService, activeWorkflowManager: ActiveWorkflowManager);
    shareWithProjects(workflow: WorkflowEntity, shareWithIds: string[], entityManager: EntityManager): Promise<SharedWorkflow[]>;
    addOwnerAndSharings(workflow: WorkflowWithSharingsAndCredentials): WorkflowWithSharingsMetaDataAndCredentials;
    addCredentialsToWorkflow(workflow: WorkflowWithSharingsMetaDataAndCredentials, currentUser: User): Promise<void>;
    validateCredentialPermissionsToUser(workflow: WorkflowEntity, allowedCredentials: CredentialsEntity[]): void;
    preventTampering(workflow: WorkflowEntity, workflowId: string, user: User): Promise<WorkflowEntity>;
    validateWorkflowCredentialUsage(newWorkflowVersion: WorkflowEntity, previousWorkflowVersion: WorkflowEntity, credentialsUserHasAccessTo: Array<{
        id: string;
    }>): WorkflowEntity;
    getNodesWithInaccessibleCreds(workflow: WorkflowEntity, userCredIds: string[]): import("n8n-workflow").INode[];
    transferOne(user: User, workflowId: string, destinationProjectId: string): Promise<{
        error: {
            message: string;
            lineNumber: number | undefined;
            timestamp: number;
            name: string;
            description: string | null | undefined;
            context: import("n8n-workflow").IDataObject;
            cause: Error | undefined;
        } | {
            name: string;
            message: string;
        };
    } | undefined>;
}
