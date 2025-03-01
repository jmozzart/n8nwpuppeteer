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
exports.SamlController = void 0;
const class_validator_1 = require("class-validator");
const express_1 = __importDefault(require("express"));
const querystring_1 = __importDefault(require("querystring"));
const url_1 = __importDefault(require("url"));
const auth_service_1 = require("../../../auth/auth.service");
const decorators_1 = require("../../../decorators");
const auth_error_1 = require("../../../errors/response-errors/auth.error");
const bad_request_error_1 = require("../../../errors/response-errors/bad-request.error");
const event_service_1 = require("../../../events/event.service");
const response_helper_1 = require("../../../response-helper");
const url_service_1 = require("../../../services/url.service");
const saml_enabled_middleware_1 = require("../middleware/saml-enabled-middleware");
const saml_helpers_1 = require("../saml-helpers");
const saml_service_ee_1 = require("../saml.service.ee");
const service_provider_ee_1 = require("../service-provider.ee");
const init_sso_post_1 = require("../views/init-sso-post");
let SamlController = class SamlController {
    constructor(authService, samlService, urlService, eventService) {
        this.authService = authService;
        this.samlService = samlService;
        this.urlService = urlService;
        this.eventService = eventService;
    }
    async getServiceProviderMetadata(_, res) {
        return res
            .header('Content-Type', 'text/xml')
            .send(this.samlService.getServiceProviderInstance().getMetadata());
    }
    async configGet() {
        const prefs = this.samlService.samlPreferences;
        return {
            ...prefs,
            entityID: (0, service_provider_ee_1.getServiceProviderEntityId)(),
            returnUrl: (0, service_provider_ee_1.getServiceProviderReturnUrl)(),
        };
    }
    async configPost(req) {
        const validationResult = await (0, class_validator_1.validate)(req.body);
        if (validationResult.length === 0) {
            const result = await this.samlService.setSamlPreferences(req.body);
            return result;
        }
        else {
            throw new bad_request_error_1.BadRequestError('Body is not a valid SamlPreferences object: ' +
                validationResult.map((e) => e.toString()).join(','));
        }
    }
    async toggleEnabledPost(req, res) {
        if (req.body.loginEnabled === undefined) {
            throw new bad_request_error_1.BadRequestError('Body should contain a boolean "loginEnabled" property');
        }
        await this.samlService.setSamlPreferences({ loginEnabled: req.body.loginEnabled });
        return res.sendStatus(200);
    }
    async acsGet(req, res) {
        return await this.acsHandler(req, res, 'redirect');
    }
    async acsPost(req, res) {
        return await this.acsHandler(req, res, 'post');
    }
    async acsHandler(req, res, binding) {
        try {
            const loginResult = await this.samlService.handleSamlLogin(req, binding);
            if ((0, saml_helpers_1.isConnectionTestRequest)(req)) {
                if (loginResult.authenticatedUser) {
                    return res.render('saml-connection-test-success', loginResult.attributes);
                }
                else {
                    return res.render('saml-connection-test-failed', {
                        message: '',
                        attributes: loginResult.attributes,
                    });
                }
            }
            if (loginResult.authenticatedUser) {
                this.eventService.emit('user-logged-in', {
                    user: loginResult.authenticatedUser,
                    authenticationMethod: 'saml',
                });
                if ((0, saml_helpers_1.isSamlLicensedAndEnabled)()) {
                    this.authService.issueCookie(res, loginResult.authenticatedUser, req.browserId);
                    if (loginResult.onboardingRequired) {
                        return res.redirect(this.urlService.getInstanceBaseUrl() + '/saml/onboarding');
                    }
                    else {
                        const redirectUrl = req.body?.RelayState ?? '/';
                        return res.redirect(this.urlService.getInstanceBaseUrl() + redirectUrl);
                    }
                }
                else {
                    return res.status(202).send(loginResult.attributes);
                }
            }
            this.eventService.emit('user-login-failed', {
                userEmail: loginResult.attributes.email ?? 'unknown',
                authenticationMethod: 'saml',
            });
            return (0, response_helper_1.sendErrorResponse)(res, new auth_error_1.AuthError('SAML Authentication failed'));
        }
        catch (error) {
            if ((0, saml_helpers_1.isConnectionTestRequest)(req)) {
                return res.render('saml-connection-test-failed', { message: error.message });
            }
            this.eventService.emit('user-login-failed', {
                userEmail: 'unknown',
                authenticationMethod: 'saml',
            });
            return (0, response_helper_1.sendErrorResponse)(res, new auth_error_1.AuthError('SAML Authentication failed: ' + error.message));
        }
    }
    async initSsoGet(req, res) {
        let redirectUrl = '';
        try {
            const refererUrl = req.headers.referer;
            if (refererUrl) {
                const parsedUrl = url_1.default.parse(refererUrl);
                if (parsedUrl?.query) {
                    const parsedQueryParams = querystring_1.default.parse(parsedUrl.query);
                    if (parsedQueryParams.redirect && typeof parsedQueryParams.redirect === 'string') {
                        redirectUrl = querystring_1.default.unescape(parsedQueryParams.redirect);
                    }
                }
            }
        }
        catch {
        }
        return await this.handleInitSSO(res, redirectUrl);
    }
    async configTestGet(_, res) {
        return await this.handleInitSSO(res, (0, service_provider_ee_1.getServiceProviderConfigTestReturnUrl)());
    }
    async handleInitSSO(res, relayState) {
        const result = await this.samlService.getLoginRequestUrl(relayState);
        if (result?.binding === 'redirect') {
            return result.context.context;
        }
        else if (result?.binding === 'post') {
            return res.send((0, init_sso_post_1.getInitSSOFormView)(result.context));
        }
        else {
            throw new auth_error_1.AuthError('SAML redirect failed, please check your SAML configuration.');
        }
    }
};
exports.SamlController = SamlController;
__decorate([
    (0, decorators_1.Get)('/metadata', { skipAuth: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SamlController.prototype, "getServiceProviderMetadata", null);
__decorate([
    (0, decorators_1.Get)('/config', { middlewares: [saml_enabled_middleware_1.samlLicensedMiddleware] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SamlController.prototype, "configGet", null);
__decorate([
    (0, decorators_1.Post)('/config', { middlewares: [saml_enabled_middleware_1.samlLicensedMiddleware] }),
    (0, decorators_1.GlobalScope)('saml:manage'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SamlController.prototype, "configPost", null);
__decorate([
    (0, decorators_1.Post)('/config/toggle', { middlewares: [saml_enabled_middleware_1.samlLicensedMiddleware] }),
    (0, decorators_1.GlobalScope)('saml:manage'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SamlController.prototype, "toggleEnabledPost", null);
__decorate([
    (0, decorators_1.Get)('/acs', { middlewares: [saml_enabled_middleware_1.samlLicensedMiddleware], skipAuth: true, usesTemplates: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SamlController.prototype, "acsGet", null);
__decorate([
    (0, decorators_1.Post)('/acs', { middlewares: [saml_enabled_middleware_1.samlLicensedMiddleware], skipAuth: true, usesTemplates: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SamlController.prototype, "acsPost", null);
__decorate([
    (0, decorators_1.Get)('/initsso', { middlewares: [saml_enabled_middleware_1.samlLicensedAndEnabledMiddleware], skipAuth: true }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SamlController.prototype, "initSsoGet", null);
__decorate([
    (0, decorators_1.Get)('/config/test', { middlewares: [saml_enabled_middleware_1.samlLicensedMiddleware] }),
    (0, decorators_1.GlobalScope)('saml:manage'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SamlController.prototype, "configTestGet", null);
exports.SamlController = SamlController = __decorate([
    (0, decorators_1.RestController)('/sso/saml'),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        saml_service_ee_1.SamlService,
        url_service_1.UrlService,
        event_service_1.EventService])
], SamlController);
//# sourceMappingURL=saml.controller.ee.js.map