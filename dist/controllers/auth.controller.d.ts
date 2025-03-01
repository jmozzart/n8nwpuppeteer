import { Response } from 'express';
import { AuthService } from '../auth/auth.service';
import { UserRepository } from '../databases/repositories/user.repository';
import { EventService } from '../events/event.service';
import type { PublicUser } from '../interfaces';
import { License } from '../license';
import { Logger } from '../logging/logger.service';
import { MfaService } from '../mfa/mfa.service';
import { PostHogClient } from '../posthog';
import { AuthenticatedRequest, LoginRequest, UserRequest } from '../requests';
import { UserService } from '../services/user.service';
export declare class AuthController {
    private readonly logger;
    private readonly authService;
    private readonly mfaService;
    private readonly userService;
    private readonly license;
    private readonly userRepository;
    private readonly eventService;
    private readonly postHog?;
    constructor(logger: Logger, authService: AuthService, mfaService: MfaService, userService: UserService, license: License, userRepository: UserRepository, eventService: EventService, postHog?: PostHogClient | undefined);
    login(req: LoginRequest, res: Response): Promise<PublicUser | undefined>;
    currentUser(req: AuthenticatedRequest): Promise<PublicUser>;
    resolveSignupToken(req: UserRequest.ResolveSignUp): Promise<{
        inviter: {
            firstName: string;
            lastName: string;
        };
    }>;
    logout(req: AuthenticatedRequest, res: Response): Promise<{
        loggedOut: boolean;
    }>;
}
