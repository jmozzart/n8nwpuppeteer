import type { User } from '../databases/entities/user';
import { SharedWorkflowRepository } from '../databases/repositories/shared-workflow.repository';
import { WorkflowRepository } from '../databases/repositories/workflow.repository';
import { UserService } from '../services/user.service';
export declare class UserOnboardingService {
    private readonly sharedWorkflowRepository;
    private readonly workflowRepository;
    private readonly userService;
    constructor(sharedWorkflowRepository: SharedWorkflowRepository, workflowRepository: WorkflowRepository, userService: UserService);
    isBelowThreshold(user: User): Promise<boolean>;
}
