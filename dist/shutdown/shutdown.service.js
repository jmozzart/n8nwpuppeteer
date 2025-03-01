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
exports.ShutdownService = exports.ComponentShutdownError = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const typedi_1 = require("typedi");
const constants_1 = require("../constants");
const logger_service_1 = require("../logging/logger.service");
class ComponentShutdownError extends n8n_workflow_1.ApplicationError {
    constructor(componentName, cause) {
        super('Failed to shutdown gracefully', {
            level: 'error',
            cause,
            extra: { component: componentName },
        });
    }
}
exports.ComponentShutdownError = ComponentShutdownError;
let ShutdownService = class ShutdownService {
    constructor(logger) {
        this.logger = logger;
        this.handlersByPriority = [];
    }
    register(priority, handler) {
        if (priority < constants_1.LOWEST_SHUTDOWN_PRIORITY || priority > constants_1.HIGHEST_SHUTDOWN_PRIORITY) {
            throw new n8n_workflow_1.ApplicationError(`Invalid shutdown priority. Please set it between ${constants_1.LOWEST_SHUTDOWN_PRIORITY} and ${constants_1.HIGHEST_SHUTDOWN_PRIORITY}.`, { extra: { priority } });
        }
        if (!this.handlersByPriority[priority]) {
            this.handlersByPriority[priority] = [];
        }
        this.handlersByPriority[priority].push(handler);
    }
    validate() {
        const handlers = this.handlersByPriority.flat();
        for (const { serviceClass, methodName } of handlers) {
            if (!typedi_1.Container.has(serviceClass)) {
                throw new n8n_workflow_1.ApplicationError(`Component "${serviceClass.name}" is not registered with the DI container. Any component using @OnShutdown() must be decorated with @Service()`);
            }
            const service = typedi_1.Container.get(serviceClass);
            if (!service[methodName]) {
                throw new n8n_workflow_1.ApplicationError(`Component "${serviceClass.name}" does not have a "${methodName}" method`);
            }
        }
    }
    shutdown() {
        if (this.shutdownPromise) {
            throw new n8n_workflow_1.ApplicationError('App is already shutting down');
        }
        this.shutdownPromise = this.startShutdown();
    }
    async waitForShutdown() {
        if (!this.shutdownPromise) {
            throw new n8n_workflow_1.ApplicationError('App is not shutting down');
        }
        await this.shutdownPromise;
    }
    isShuttingDown() {
        return !!this.shutdownPromise;
    }
    async startShutdown() {
        const handlers = Object.values(this.handlersByPriority).reverse();
        for (const handlerGroup of handlers) {
            await Promise.allSettled(handlerGroup.map(async (handler) => await this.shutdownComponent(handler)));
        }
    }
    async shutdownComponent({ serviceClass, methodName }) {
        const name = `${serviceClass.name}.${methodName}()`;
        try {
            this.logger.debug(`Shutting down component "${name}"`);
            const service = typedi_1.Container.get(serviceClass);
            const method = service[methodName];
            await method.call(service);
        }
        catch (error) {
            (0, n8n_workflow_1.assert)(error instanceof Error);
            n8n_workflow_1.ErrorReporterProxy.error(new ComponentShutdownError(name, error));
        }
    }
};
exports.ShutdownService = ShutdownService;
exports.ShutdownService = ShutdownService = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [logger_service_1.Logger])
], ShutdownService);
//# sourceMappingURL=shutdown.service.js.map