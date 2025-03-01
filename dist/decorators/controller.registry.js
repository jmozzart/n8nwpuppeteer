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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ControllerRegistry = exports.getRouteMetadata = exports.getControllerMetadata = void 0;
const config_1 = require("@n8n/config");
const express_1 = require("express");
const express_rate_limit_1 = require("express-rate-limit");
const n8n_workflow_1 = require("n8n-workflow");
const typedi_1 = require("typedi");
const auth_service_1 = require("../auth/auth.service");
const constants_1 = require("../constants");
const unauthenticated_error_1 = require("../errors/response-errors/unauthenticated.error");
const license_1 = require("../license");
const check_access_1 = require("../permissions/check-access");
const response_helper_1 = require("../response-helper");
const registry = new Map();
const getControllerMetadata = (controllerClass) => {
    let metadata = registry.get(controllerClass);
    if (!metadata) {
        metadata = {
            basePath: '/',
            middlewares: [],
            routes: new Map(),
        };
        registry.set(controllerClass, metadata);
    }
    return metadata;
};
exports.getControllerMetadata = getControllerMetadata;
const getRouteMetadata = (controllerClass, handlerName) => {
    const metadata = (0, exports.getControllerMetadata)(controllerClass);
    let route = metadata.routes.get(handlerName);
    if (!route) {
        route = {};
        route.args = [];
        metadata.routes.set(handlerName, route);
    }
    return route;
};
exports.getRouteMetadata = getRouteMetadata;
let ControllerRegistry = class ControllerRegistry {
    constructor(license, authService, globalConfig) {
        this.license = license;
        this.authService = authService;
        this.globalConfig = globalConfig;
    }
    activate(app) {
        for (const controllerClass of registry.keys()) {
            this.activateController(app, controllerClass);
        }
    }
    activateController(app, controllerClass) {
        const metadata = registry.get(controllerClass);
        const router = (0, express_1.Router)({ mergeParams: true });
        const prefix = `/${this.globalConfig.endpoints.rest}/${metadata.basePath}`
            .replace(/\/+/g, '/')
            .replace(/\/$/, '');
        app.use(prefix, router);
        const controller = typedi_1.Container.get(controllerClass);
        const controllerMiddlewares = metadata.middlewares.map((handlerName) => controller[handlerName].bind(controller));
        for (const [handlerName, route] of metadata.routes) {
            const argTypes = Reflect.getMetadata('design:paramtypes', controller, handlerName);
            const handler = async (req, res) => {
                const args = [req, res];
                for (let index = 0; index < route.args.length; index++) {
                    const arg = route.args[index];
                    if (!arg)
                        continue;
                    if (arg.type === 'param')
                        args.push(req.params[arg.key]);
                    else if (['body', 'query'].includes(arg.type)) {
                        const paramType = argTypes[index];
                        if (paramType && 'parse' in paramType) {
                            const output = paramType.safeParse(req[arg.type]);
                            if (output.success)
                                args.push(output.data);
                            else {
                                return res.status(400).json(output.error.errors[0]);
                            }
                        }
                    }
                    else
                        throw new n8n_workflow_1.ApplicationError('Unknown arg type: ' + arg.type);
                }
                return await controller[handlerName](...args);
            };
            router[route.method](route.path, ...(constants_1.inProduction && route.rateLimit
                ? [this.createRateLimitMiddleware(route.rateLimit)]
                : []), ...(route.skipAuth ? [] : [this.authService.authMiddleware]), ...(route.licenseFeature ? [this.createLicenseMiddleware(route.licenseFeature)] : []), ...(route.accessScope ? [this.createScopedMiddleware(route.accessScope)] : []), ...controllerMiddlewares, ...route.middlewares, route.usesTemplates ? handler : (0, response_helper_1.send)(handler));
        }
    }
    createRateLimitMiddleware(rateLimit) {
        if (typeof rateLimit === 'boolean')
            rateLimit = {};
        return (0, express_rate_limit_1.rateLimit)({
            windowMs: rateLimit.windowMs,
            limit: rateLimit.limit,
            message: { message: 'Too many requests' },
        });
    }
    createLicenseMiddleware(feature) {
        return (_req, res, next) => {
            if (!this.license.isFeatureEnabled(feature)) {
                return res
                    .status(403)
                    .json({ status: 'error', message: 'Plan lacks license for this feature' });
            }
            return next();
        };
    }
    createScopedMiddleware(accessScope) {
        return async (req, res, next) => {
            if (!req.user)
                throw new unauthenticated_error_1.UnauthenticatedError();
            const { scope, globalOnly } = accessScope;
            if (!(await (0, check_access_1.userHasScopes)(req.user, [scope], globalOnly, req.params))) {
                return res.status(403).json({
                    status: 'error',
                    message: constants_1.RESPONSE_ERROR_MESSAGES.MISSING_SCOPE,
                });
            }
            return next();
        };
    }
};
exports.ControllerRegistry = ControllerRegistry;
exports.ControllerRegistry = ControllerRegistry = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [license_1.License,
        auth_service_1.AuthService,
        config_1.GlobalConfig])
], ControllerRegistry);
//# sourceMappingURL=controller.registry.js.map