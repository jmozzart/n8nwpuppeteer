import { CollaborationState } from '../collaboration/collaboration.state';
import type { User } from '../databases/entities/user';
import { UserRepository } from '../databases/repositories/user.repository';
import { Push } from '../push';
import { AccessService } from '../services/access.service';
export declare class CollaborationService {
    private readonly push;
    private readonly state;
    private readonly userRepository;
    private readonly accessService;
    constructor(push: Push, state: CollaborationState, userRepository: UserRepository, accessService: AccessService);
    init(): void;
    handleUserMessage(userId: User['id'], msg: unknown): Promise<void>;
    private handleWorkflowOpened;
    private handleWorkflowClosed;
    private sendWorkflowUsersChangedMessage;
}
