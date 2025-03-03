import type { IUserSettings } from 'n8n-workflow';
import type { User } from '../databases/entities/user';
import { UserRepository } from '../databases/repositories/user.repository';
import { EventService } from '../events/event.service';
import type { Invitation, PublicUser } from '../interfaces';
import { Logger } from '../logging/logger.service';
import type { PostHogClient } from '../posthog';
import type { UserRequest } from '../requests';
import { UrlService } from '../services/url.service';
import { UserManagementMailer } from '../user-management/email';
export declare class UserService {
    private readonly logger;
    private readonly userRepository;
    private readonly mailer;
    private readonly urlService;
    private readonly eventService;
    constructor(logger: Logger, userRepository: UserRepository, mailer: UserManagementMailer, urlService: UrlService, eventService: EventService);
    update(userId: string, data: Partial<User>): Promise<void>;
    getManager(): import("@n8n/typeorm").EntityManager;
    updateSettings(userId: string, newSettings: Partial<IUserSettings>): Promise<void>;
    toPublic(user: User, options?: {
        withInviteUrl?: boolean;
        inviterId?: string;
        posthog?: PostHogClient;
        withScopes?: boolean;
    }): Promise<PublicUser>;
    private addInviteUrl;
    private addFeatureFlags;
    private sendEmails;
    inviteUsers(owner: User, invitations: Invitation[]): Promise<{
        usersInvited: UserRequest.InviteResponse[];
        usersCreated: string[];
    }>;
}
