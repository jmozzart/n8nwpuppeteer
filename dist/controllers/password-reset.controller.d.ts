import { Response } from 'express';
import { AuthService } from '../auth/auth.service';
import { UserRepository } from '../databases/repositories/user.repository';
import { EventService } from '../events/event.service';
import { ExternalHooks } from '../external-hooks';
import { License } from '../license';
import { Logger } from '../logging/logger.service';
import { MfaService } from '../mfa/mfa.service';
import { PasswordResetRequest } from '../requests';
import { PasswordUtility } from '../services/password.utility';
import { UserService } from '../services/user.service';
import { UserManagementMailer } from '../user-management/email';
export declare class PasswordResetController {
    private readonly logger;
    private readonly externalHooks;
    private readonly mailer;
    private readonly authService;
    private readonly userService;
    private readonly mfaService;
    private readonly license;
    private readonly passwordUtility;
    private readonly userRepository;
    private readonly eventService;
    constructor(logger: Logger, externalHooks: ExternalHooks, mailer: UserManagementMailer, authService: AuthService, userService: UserService, mfaService: MfaService, license: License, passwordUtility: PasswordUtility, userRepository: UserRepository, eventService: EventService);
    forgotPassword(req: PasswordResetRequest.Email): Promise<void>;
    resolvePasswordToken(req: PasswordResetRequest.Credentials): Promise<void>;
    changePassword(req: PasswordResetRequest.NewPassword, res: Response): Promise<void>;
}
