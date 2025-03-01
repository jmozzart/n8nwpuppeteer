import { Response } from 'express';
import { AuthService } from '../auth/auth.service';
import { SettingsRepository } from '../databases/repositories/settings.repository';
import { UserRepository } from '../databases/repositories/user.repository';
import { EventService } from '../events/event.service';
import { Logger } from '../logging/logger.service';
import { PostHogClient } from '../posthog';
import { OwnerRequest } from '../requests';
import { PasswordUtility } from '../services/password.utility';
import { UserService } from '../services/user.service';
export declare class OwnerController {
    private readonly logger;
    private readonly eventService;
    private readonly settingsRepository;
    private readonly authService;
    private readonly userService;
    private readonly passwordUtility;
    private readonly postHog;
    private readonly userRepository;
    constructor(logger: Logger, eventService: EventService, settingsRepository: SettingsRepository, authService: AuthService, userService: UserService, passwordUtility: PasswordUtility, postHog: PostHogClient, userRepository: UserRepository);
    setupOwner(req: OwnerRequest.Post, res: Response): Promise<import("../interfaces").PublicUser>;
    dismissBanner(req: OwnerRequest.DismissBanner): Promise<{
        success: boolean;
    }>;
}
