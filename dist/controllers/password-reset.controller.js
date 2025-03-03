"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordResetController = void 0;
const validator_1 = __importDefault(require("validator"));
const auth_service_1 = require("../auth/auth.service");
const constants_1 = require("../constants");
const user_repository_1 = require("../databases/repositories/user.repository");
const decorators_1 = require("../decorators");
const bad_request_error_1 = require("../errors/response-errors/bad-request.error");
const forbidden_error_1 = require("../errors/response-errors/forbidden.error");
const internal_server_error_1 = require("../errors/response-errors/internal-server.error");
const not_found_error_1 = require("../errors/response-errors/not-found.error");
const unprocessable_error_1 = require("../errors/response-errors/unprocessable.error");
const event_service_1 = require("../events/event.service");
const external_hooks_1 = require("../external-hooks");
const license_1 = require("../license");
const logger_service_1 = require("../logging/logger.service");
const mfa_service_1 = require("../mfa/mfa.service");
const password_utility_1 = require("../services/password.utility");
const user_service_1 = require("../services/user.service");
const sso_helpers_1 = require("../sso/sso-helpers");
const email_1 = require("../user-management/email");
let PasswordResetController = class PasswordResetController {
    constructor(logger, externalHooks, mailer, authService, userService, mfaService, license, passwordUtility, userRepository, eventService) {
        this.logger = logger;
        this.externalHooks = externalHooks;
        this.mailer = mailer;
        this.authService = authService;
        this.userService = userService;
        this.mfaService = mfaService;
        this.license = license;
        this.passwordUtility = passwordUtility;
        this.userRepository = userRepository;
        this.eventService = eventService;
    }
    async forgotPassword(req) {
        if (!this.mailer.isEmailSetUp) {
            this.logger.debug('Request to send password reset email failed because emailing was not set up');
            throw new internal_server_error_1.InternalServerError('Email sending must be set up in order to request a password reset email');
        }
        const { email } = req.body;
        if (!email) {
            this.logger.debug('Request to send password reset email failed because of missing email in payload', { payload: req.body });
            throw new bad_request_error_1.BadRequestError('Email is mandatory');
        }
        if (!validator_1.default.isEmail(email)) {
            this.logger.debug('Request to send password reset email failed because of invalid email in payload', { invalidEmail: email });
            throw new bad_request_error_1.BadRequestError('Invalid email address');
        }
        const user = await this.userRepository.findNonShellUser(email);
        if (!user?.isOwner && !this.license.isWithinUsersLimit()) {
            this.logger.debug('Request to send password reset email failed because the user limit was reached');
            throw new forbidden_error_1.ForbiddenError(constants_1.RESPONSE_ERROR_MESSAGES.USERS_QUOTA_REACHED);
        }
        if ((0, sso_helpers_1.isSamlCurrentAuthenticationMethod)() &&
            !(user?.hasGlobalScope('user:resetPassword') === true ||
                user?.settings?.allowSSOManualLogin === true)) {
            this.logger.debug('Request to send password reset email failed because login is handled by SAML');
            throw new forbidden_error_1.ForbiddenError('Login is handled by SAML. Please contact your Identity Provider to reset your password.');
        }
        const ldapIdentity = user?.authIdentities?.find((i) => i.providerType === 'ldap');
        if (!user?.password || (ldapIdentity && user.disabled)) {
            this.logger.debug('Request to send password reset email failed because no user was found for the provided email', { invalidEmail: email });
            return;
        }
        if (this.license.isLdapEnabled() && ldapIdentity) {
            throw new unprocessable_error_1.UnprocessableRequestError('forgotPassword.ldapUserPasswordResetUnavailable');
        }
        const url = this.authService.generatePasswordResetUrl(user);
        const { id, firstName } = user;
        try {
            await this.mailer.passwordReset({
                email,
                firstName,
                passwordResetUrl: url,
            });
        }
        catch (error) {
            this.eventService.emit('email-failed', {
                user,
                messageType: 'Reset password',
                publicApi: false,
            });
            if (error instanceof Error) {
                throw new internal_server_error_1.InternalServerError(`Please contact your administrator: ${error.message}`);
            }
        }
        this.logger.info('Sent password reset email successfully', { userId: user.id, email });
        this.eventService.emit('user-transactional-email-sent', {
            userId: id,
            messageType: 'Reset password',
            publicApi: false,
        });
        this.eventService.emit('user-password-reset-request-click', { user });
    }
    async resolvePasswordToken(req) {
        const { token } = req.query;
        if (!token) {
            this.logger.debug('Request to resolve password token failed because of missing password reset token', {
                queryString: req.query,
            });
            throw new bad_request_error_1.BadRequestError('');
        }
        const user = await this.authService.resolvePasswordResetToken(token);
        if (!user)
            throw new not_found_error_1.NotFoundError('');
        if (!user?.isOwner && !this.license.isWithinUsersLimit()) {
            this.logger.debug('Request to resolve password token failed because the user limit was reached', { userId: user.id });
            throw new forbidden_error_1.ForbiddenError(constants_1.RESPONSE_ERROR_MESSAGES.USERS_QUOTA_REACHED);
        }
        this.logger.info('Reset-password token resolved successfully', { userId: user.id });
        this.eventService.emit('user-password-reset-email-click', { user });
    }
    async changePassword(req, res) {
        const { token, password, mfaToken } = req.body;
        if (!token || !password) {
            this.logger.debug('Request to change password failed because of missing user ID or password or reset password token in payload', {
                payload: req.body,
            });
            throw new bad_request_error_1.BadRequestError('Missing user ID or password or reset password token');
        }
        const validPassword = this.passwordUtility.validate(password);
        const user = await this.authService.resolvePasswordResetToken(token);
        if (!user)
            throw new not_found_error_1.NotFoundError('');
        if (user.mfaEnabled) {
            if (!mfaToken)
                throw new bad_request_error_1.BadRequestError('If MFA enabled, mfaToken is required.');
            const { decryptedSecret: secret } = await this.mfaService.getSecretAndRecoveryCodes(user.id);
            const validToken = this.mfaService.totp.verifySecret({ secret, token: mfaToken });
            if (!validToken)
                throw new bad_request_error_1.BadRequestError('Invalid MFA token.');
        }
        const passwordHash = await this.passwordUtility.hash(validPassword);
        await this.userService.update(user.id, { password: passwordHash });
        this.logger.info('User password updated successfully', { userId: user.id });
        this.authService.issueCookie(res, user, req.browserId);
        this.eventService.emit('user-updated', { user, fieldsChanged: ['password'] });
        const ldapIdentity = user?.authIdentities?.find((i) => i.providerType === 'ldap');
        if (ldapIdentity) {
            this.eventService.emit('user-signed-up', {
                user,
                userType: 'email',
                wasDisabledLdapUser: true,
            });
        }
        await this.externalHooks.run('user.password.update', [user.email, passwordHash]);
    }
};
exports.PasswordResetController = PasswordResetController;
__decorate([
    (0, decorators_1.Post)('/forgot-password', { skipAuth: true, rateLimit: { limit: 3 } }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PasswordResetController.prototype, "forgotPassword", null);
__decorate([
    (0, decorators_1.Get)('/resolve-password-token', { skipAuth: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PasswordResetController.prototype, "resolvePasswordToken", null);
__decorate([
    (0, decorators_1.Post)('/change-password', { skipAuth: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PasswordResetController.prototype, "changePassword", null);
exports.PasswordResetController = PasswordResetController = __decorate([
    (0, decorators_1.RestController)(),
    __metadata("design:paramtypes", [logger_service_1.Logger,
        external_hooks_1.ExternalHooks,
        email_1.UserManagementMailer,
        auth_service_1.AuthService,
        user_service_1.UserService,
        mfa_service_1.MfaService,
        license_1.License,
        password_utility_1.PasswordUtility,
        user_repository_1.UserRepository,
        event_service_1.EventService])
], PasswordResetController);
//# sourceMappingURL=password-reset.controller.js.map