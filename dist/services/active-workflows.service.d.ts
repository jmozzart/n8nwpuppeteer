import { ActivationErrorsService } from '../activation-errors.service';
import type { User } from '../databases/entities/user';
import { SharedWorkflowRepository } from '../databases/repositories/shared-workflow.repository';
import { WorkflowRepository } from '../databases/repositories/workflow.repository';
import { Logger } from '../logging/logger.service';
export declare class ActiveWorkflowsService {
    private readonly logger;
    private readonly workflowRepository;
    private readonly sharedWorkflowRepository;
    private readonly activationErrorsService;
    constructor(logger: Logger, workflowRepository: WorkflowRepository, sharedWorkflowRepository: SharedWorkflowRepository, activationErrorsService: ActivationErrorsService);
    getAllActiveIdsInStorage(): Promise<string[]>;
    getAllActiveIdsFor(user: User): Promise<string[]>;
    getActivationError(workflowId: string, user: User): Promise<string | null>;
}
