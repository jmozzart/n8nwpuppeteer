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
exports.OwnerController = void 0;
const validator_1 = __importDefault(require("validator"));
const auth_service_1 = require("../auth/auth.service");
const config_1 = __importDefault(require("../config"));
const settings_repository_1 = require("../databases/repositories/settings.repository");
const user_repository_1 = require("../databases/repositories/user.repository");
const decorators_1 = require("../decorators");
const bad_request_error_1 = require("../errors/response-errors/bad-request.error");
const event_service_1 = require("../events/event.service");
const generic_helpers_1 = require("../generic-helpers");
const logger_service_1 = require("../logging/logger.service");
const posthog_1 = require("../posthog");
const password_utility_1 = require("../services/password.utility");
const user_service_1 = require("../services/user.service");
let OwnerController = class OwnerController {
    constructor(logger, eventService, settingsRepository, authService, userService, passwordUtility, postHog, userRepository) {
        this.logger = logger;
        this.eventService = eventService;
        this.settingsRepository = settingsRepository;
        this.authService = authService;
        this.userService = userService;
        this.passwordUtility = passwordUtility;
        this.postHog = postHog;
        this.userRepository = userRepository;
    }
    async setupOwner(req, res) {
        const { email, firstName, lastName, password } = req.body;
        if (config_1.default.getEnv('userManagement.isInstanceOwnerSetUp')) {
            this.logger.debug('Request to claim instance ownership failed because instance owner already exists');
            throw new bad_request_error_1.BadRequestError('Instance owner already setup');
        }
        if (!email || !validator_1.default.isEmail(email)) {
            this.logger.debug('Request to claim instance ownership failed because of invalid email', {
                invalidEmail: email,
            });
            throw new bad_request_error_1.BadRequestError('Invalid email address');
        }
        const validPassword = this.passwordUtility.validate(password);
        if (!firstName || !lastName) {
            this.logger.debug('Request to claim instance ownership failed because of missing first name or last name in payload', { payload: req.body });
            throw new bad_request_error_1.BadRequestError('First and last names are mandatory');
        }
        let owner = await this.userRepository.findOneOrFail({
            where: { role: 'global:owner' },
        });
        owner.email = email;
        owner.firstName = firstName;
        owner.lastName = lastName;
        owner.password = await this.passwordUtility.hash(validPassword);
        await (0, generic_helpers_1.validateEntity)(owner);
        owner = await this.userRepository.save(owner, { transaction: false });
        this.logger.info('Owner was set up successfully');
        await this.settingsRepository.update({ key: 'userManagement.isInstanceOwnerSetUp' }, { value: JSON.stringify(true) });
        config_1.default.set('userManagement.isInstanceOwnerSetUp', true);
        this.logger.debug('Setting isInstanceOwnerSetUp updated successfully');
        this.authService.issueCookie(res, owner, req.browserId);
        this.eventService.emit('instance-owner-setup', { userId: owner.id });
        return await this.userService.toPublic(owner, { posthog: this.postHog, withScopes: true });
    }
    async dismissBanner(req) {
        const bannerName = 'banner' in req.body ? req.body.banner : '';
        return await this.settingsRepository.dismissBanner({ bannerName });
    }
};
exports.OwnerController = OwnerController;
__decorate([
    (0, decorators_1.Post)('/setup', { skipAuth: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], OwnerController.prototype, "setupOwner", null);
__decorate([
    (0, decorators_1.Post)('/dismiss-banner'),
    (0, decorators_1.GlobalScope)('banner:dismiss'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OwnerController.prototype, "dismissBanner", null);
exports.OwnerController = OwnerController = __decorate([
    (0, decorators_1.RestController)('/owner'),
    __metadata("design:paramtypes", [logger_service_1.Logger,
        event_service_1.EventService,
        settings_repository_1.SettingsRepository,
        auth_service_1.AuthService,
        user_service_1.UserService,
        password_utility_1.PasswordUtility,
        posthog_1.PostHogClient,
        user_repository_1.UserRepository])
], OwnerController);
//# sourceMappingURL=owner.controller.js.map