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
exports.ActiveWorkflowsService = void 0;
const typedi_1 = require("typedi");
const activation_errors_service_1 = require("../activation-errors.service");
const shared_workflow_repository_1 = require("../databases/repositories/shared-workflow.repository");
const workflow_repository_1 = require("../databases/repositories/workflow.repository");
const bad_request_error_1 = require("../errors/response-errors/bad-request.error");
const logger_service_1 = require("../logging/logger.service");
let ActiveWorkflowsService = class ActiveWorkflowsService {
    constructor(logger, workflowRepository, sharedWorkflowRepository, activationErrorsService) {
        this.logger = logger;
        this.workflowRepository = workflowRepository;
        this.sharedWorkflowRepository = sharedWorkflowRepository;
        this.activationErrorsService = activationErrorsService;
    }
    async getAllActiveIdsInStorage() {
        const activationErrors = await this.activationErrorsService.getAll();
        const activeWorkflowIds = await this.workflowRepository.getActiveIds();
        return activeWorkflowIds.filter((workflowId) => !activationErrors[workflowId]);
    }
    async getAllActiveIdsFor(user) {
        const activationErrors = await this.activationErrorsService.getAll();
        const activeWorkflowIds = await this.workflowRepository.getActiveIds();
        const hasFullAccess = user.hasGlobalScope('workflow:list');
        if (hasFullAccess) {
            return activeWorkflowIds.filter((workflowId) => !activationErrors[workflowId]);
        }
        const sharedWorkflowIds = await this.sharedWorkflowRepository.getSharedWorkflowIds(activeWorkflowIds);
        return sharedWorkflowIds.filter((workflowId) => !activationErrors[workflowId]);
    }
    async getActivationError(workflowId, user) {
        const workflow = await this.sharedWorkflowRepository.findWorkflowForUser(workflowId, user, [
            'workflow:read',
        ]);
        if (!workflow) {
            this.logger.warn('User attempted to access workflow errors without permissions', {
                workflowId,
                userId: user.id,
            });
            throw new bad_request_error_1.BadRequestError(`Workflow with ID "${workflowId}" could not be found.`);
        }
        return await this.activationErrorsService.get(workflowId);
    }
};
exports.ActiveWorkflowsService = ActiveWorkflowsService;
exports.ActiveWorkflowsService = ActiveWorkflowsService = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [logger_service_1.Logger,
        workflow_repository_1.WorkflowRepository,
        shared_workflow_repository_1.SharedWorkflowRepository,
        activation_errors_service_1.ActivationErrorsService])
], ActiveWorkflowsService);
//# sourceMappingURL=active-workflows.service.js.map