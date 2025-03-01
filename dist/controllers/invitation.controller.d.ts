import { Response } from 'express';
import { AuthService } from '../auth/auth.service';
import { UserRepository } from '../databases/repositories/user.repository';
import { EventService } from '../events/event.service';
import { ExternalHooks } from '../external-hooks';
import { License } from '../license';
import { Logger } from '../logging/logger.service';
import { PostHogClient } from '../posthog';
import { UserRequest } from '../requests';
import { PasswordUtility } from '../services/password.utility';
import { UserService } from '../services/user.service';
export declare class InvitationController {
    private readonly logger;
    private readonly externalHooks;
    private readonly authService;
    private readonly userService;
    private readonly license;
    private readonly passwordUtility;
    private readonly userRepository;
    private readonly postHog;
    private readonly eventService;
    constructor(logger: Logger, externalHooks: ExternalHooks, authService: AuthService, userService: UserService, license: License, passwordUtility: PasswordUtility, userRepository: UserRepository, postHog: PostHogClient, eventService: EventService);
    inviteUser(req: UserRequest.Invite): Promise<UserRequest.InviteResponse[]>;
    acceptInvitation(req: UserRequest.Update, res: Response): Promise<import("../interfaces").PublicUser>;
}
