import { RoleChangeRequestDto, SettingsUpdateRequestDto } from '@n8n/api-types';
import { Response } from 'express';
import { AuthService } from '../auth/auth.service';
import { CredentialsService } from '../credentials/credentials.service';
import { ProjectRepository } from '../databases/repositories/project.repository';
import { SharedCredentialsRepository } from '../databases/repositories/shared-credentials.repository';
import { SharedWorkflowRepository } from '../databases/repositories/shared-workflow.repository';
import { UserRepository } from '../databases/repositories/user.repository';
import { EventService } from '../events/event.service';
import { ExternalHooks } from '../external-hooks';
import type { PublicUser } from '../interfaces';
import { Logger } from '../logging/logger.service';
import { AuthenticatedRequest, ListQuery, UserRequest } from '../requests';
import { ProjectService } from '../services/project.service';
import { UserService } from '../services/user.service';
import { WorkflowService } from '../workflows/workflow.service';
export declare class UsersController {
    private readonly logger;
    private readonly externalHooks;
    private readonly sharedCredentialsRepository;
    private readonly sharedWorkflowRepository;
    private readonly userRepository;
    private readonly authService;
    private readonly userService;
    private readonly projectRepository;
    private readonly workflowService;
    private readonly credentialsService;
    private readonly projectService;
    private readonly eventService;
    constructor(logger: Logger, externalHooks: ExternalHooks, sharedCredentialsRepository: SharedCredentialsRepository, sharedWorkflowRepository: SharedWorkflowRepository, userRepository: UserRepository, authService: AuthService, userService: UserService, projectRepository: ProjectRepository, workflowService: WorkflowService, credentialsService: CredentialsService, projectService: ProjectService, eventService: EventService);
    static ERROR_MESSAGES: {
        readonly CHANGE_ROLE: {
            readonly NO_USER: "Target user not found";
            readonly NO_ADMIN_ON_OWNER: "Admin cannot change role on global owner";
            readonly NO_OWNER_ON_OWNER: "Owner cannot change role on global owner";
        };
    };
    private removeSupplementaryFields;
    listUsers(req: ListQuery.Request): Promise<Partial<PublicUser>[]>;
    getUserPasswordResetLink(req: UserRequest.PasswordResetLink): Promise<{
        link: string;
    }>;
    updateUserSettings(_req: AuthenticatedRequest, _res: Response, payload: SettingsUpdateRequestDto, id: string): Promise<import("n8n-workflow").IUserSettings | null>;
    deleteUser(req: UserRequest.Delete): Promise<{
        success: boolean;
    }>;
    changeGlobalRole(req: AuthenticatedRequest, _: Response, payload: RoleChangeRequestDto, id: string): Promise<{
        success: boolean;
    }>;
}
