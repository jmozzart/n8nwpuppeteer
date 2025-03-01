"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowService = void 0;
const typeorm_1 = require("@n8n/typeorm");
const omit_1 = __importDefault(require("lodash/omit"));
const pick_1 = __importDefault(require("lodash/pick"));
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const typedi_1 = require("typedi");
const uuid_1 = require("uuid");
const active_workflow_manager_1 = require("../active-workflow-manager");
const config_1 = __importDefault(require("../config"));
const shared_workflow_1 = require("../databases/entities/shared-workflow");
const execution_repository_1 = require("../databases/repositories/execution.repository");
const shared_workflow_repository_1 = require("../databases/repositories/shared-workflow.repository");
const workflow_tag_mapping_repository_1 = require("../databases/repositories/workflow-tag-mapping.repository");
const workflow_repository_1 = require("../databases/repositories/workflow.repository");
const bad_request_error_1 = require("../errors/response-errors/bad-request.error");
const not_found_error_1 = require("../errors/response-errors/not-found.error");
const event_service_1 = require("../events/event.service");
const external_hooks_1 = require("../external-hooks");
const generic_helpers_1 = require("../generic-helpers");
const logger_service_1 = require("../logging/logger.service");
const requests_1 = require("../requests");
const orchestration_service_1 = require("../services/orchestration.service");
const ownership_service_1 = require("../services/ownership.service");
const project_service_1 = require("../services/project.service");
const role_service_1 = require("../services/role.service");
const tag_service_1 = require("../services/tag.service");
const WorkflowHelpers = __importStar(require("../workflow-helpers"));
const workflow_history_service_ee_1 = require("./workflow-history/workflow-history.service.ee");
const workflow_sharing_service_1 = require("./workflow-sharing.service");
let WorkflowService = class WorkflowService {
    constructor(logger, sharedWorkflowRepository, workflowRepository, workflowTagMappingRepository, binaryDataService, ownershipService, tagService, workflowHistoryService, orchestrationService, externalHooks, activeWorkflowManager, roleService, workflowSharingService, projectService, executionRepository, eventService) {
        this.logger = logger;
        this.sharedWorkflowRepository = sharedWorkflowRepository;
        this.workflowRepository = workflowRepository;
        this.workflowTagMappingRepository = workflowTagMappingRepository;
        this.binaryDataService = binaryDataService;
        this.ownershipService = ownershipService;
        this.tagService = tagService;
        this.workflowHistoryService = workflowHistoryService;
        this.orchestrationService = orchestrationService;
        this.externalHooks = externalHooks;
        this.activeWorkflowManager = activeWorkflowManager;
        this.roleService = roleService;
        this.workflowSharingService = workflowSharingService;
        this.projectService = projectService;
        this.executionRepository = executionRepository;
        this.eventService = eventService;
    }
    async getMany(user, options, includeScopes) {
        const sharedWorkflowIds = await this.workflowSharingService.getSharedWorkflowIds(user, {
            scopes: ['workflow:read'],
        });
        let { workflows, count } = await this.workflowRepository.getMany(sharedWorkflowIds, options);
        if ((0, requests_1.hasSharing)(workflows)) {
            workflows = workflows.map((w) => this.ownershipService.addOwnedByAndSharedWith(w));
        }
        if (includeScopes) {
            const projectRelations = await this.projectService.getProjectRelationsForUser(user);
            workflows = workflows.map((w) => this.roleService.addScopes(w, user, projectRelations));
        }
        workflows.forEach((w) => {
            delete w.shared;
        });
        return { workflows, count };
    }
    async update(user, workflowUpdateData, workflowId, tagIds, forceSave) {
        const workflow = await this.sharedWorkflowRepository.findWorkflowForUser(workflowId, user, [
            'workflow:update',
        ]);
        if (!workflow) {
            this.logger.warn('User attempted to update a workflow without permissions', {
                workflowId,
                userId: user.id,
            });
            throw new not_found_error_1.NotFoundError('You do not have permission to update this workflow. Ask the owner to share it with you.');
        }
        if (!forceSave &&
            workflowUpdateData.versionId !== '' &&
            workflowUpdateData.versionId !== workflow.versionId) {
            throw new bad_request_error_1.BadRequestError('Your most recent changes may be lost, because someone else just updated this workflow. Open this workflow in a new tab to see those new updates.', 100);
        }
        if (Object.keys((0, omit_1.default)(workflowUpdateData, ['id', 'versionId', 'active'])).length > 0) {
            workflowUpdateData.versionId = (0, uuid_1.v4)();
            this.logger.debug(`Updating versionId for workflow ${workflowId} for user ${user.id} after saving`, {
                previousVersionId: workflow.versionId,
                newVersionId: workflowUpdateData.versionId,
            });
        }
        await WorkflowHelpers.replaceInvalidCredentials(workflowUpdateData);
        WorkflowHelpers.addNodeIds(workflowUpdateData);
        await this.externalHooks.run('workflow.update', [workflowUpdateData]);
        if (workflow.active) {
            await this.activeWorkflowManager.remove(workflowId);
        }
        const workflowSettings = workflowUpdateData.settings ?? {};
        const keysAllowingDefault = [
            'timezone',
            'saveDataErrorExecution',
            'saveDataSuccessExecution',
            'saveManualExecutions',
            'saveExecutionProgress',
        ];
        for (const key of keysAllowingDefault) {
            if (workflowSettings[key] === 'DEFAULT') {
                delete workflowSettings[key];
            }
        }
        if (workflowSettings.executionTimeout === config_1.default.get('executions.timeout')) {
            delete workflowSettings.executionTimeout;
        }
        if (workflowUpdateData.name) {
            workflowUpdateData.updatedAt = new Date();
            await (0, generic_helpers_1.validateEntity)(workflowUpdateData);
        }
        await this.workflowRepository.update(workflowId, (0, pick_1.default)(workflowUpdateData, [
            'name',
            'active',
            'nodes',
            'connections',
            'meta',
            'settings',
            'staticData',
            'pinData',
            'versionId',
        ]));
        if (tagIds && !config_1.default.getEnv('workflowTagsDisabled')) {
            await this.workflowTagMappingRepository.overwriteTaggings(workflowId, tagIds);
        }
        if (workflowUpdateData.versionId !== workflow.versionId) {
            await this.workflowHistoryService.saveVersion(user, workflowUpdateData, workflowId);
        }
        const relations = config_1.default.getEnv('workflowTagsDisabled') ? [] : ['tags'];
        const updatedWorkflow = await this.workflowRepository.findOne({
            where: { id: workflowId },
            relations,
        });
        if (updatedWorkflow === null) {
            throw new bad_request_error_1.BadRequestError(`Workflow with ID "${workflowId}" could not be found to be updated.`);
        }
        if (updatedWorkflow.tags?.length && tagIds?.length) {
            updatedWorkflow.tags = this.tagService.sortByRequestOrder(updatedWorkflow.tags, {
                requestOrder: tagIds,
            });
        }
        await this.externalHooks.run('workflow.afterUpdate', [updatedWorkflow]);
        this.eventService.emit('workflow-saved', {
            user,
            workflow: updatedWorkflow,
            publicApi: false,
        });
        if (updatedWorkflow.active) {
            try {
                await this.externalHooks.run('workflow.activate', [updatedWorkflow]);
                await this.activeWorkflowManager.add(workflowId, workflow.active ? 'update' : 'activate');
            }
            catch (error) {
                await this.workflowRepository.update(workflowId, {
                    active: false,
                    versionId: workflow.versionId,
                });
                updatedWorkflow.active = false;
                let message;
                if (error instanceof n8n_workflow_1.NodeApiError)
                    message = error.description;
                message = message ?? error.message;
                throw new bad_request_error_1.BadRequestError(message);
            }
        }
        await this.orchestrationService.init();
        return updatedWorkflow;
    }
    async delete(user, workflowId) {
        await this.externalHooks.run('workflow.delete', [workflowId]);
        const workflow = await this.sharedWorkflowRepository.findWorkflowForUser(workflowId, user, [
            'workflow:delete',
        ]);
        if (!workflow) {
            return;
        }
        if (workflow.active) {
            await this.activeWorkflowManager.remove(workflowId);
        }
        const idsForDeletion = await this.executionRepository
            .find({
            select: ['id'],
            where: { workflowId },
        })
            .then((rows) => rows.map(({ id: executionId }) => ({ workflowId, executionId })));
        await this.workflowRepository.delete(workflowId);
        await this.binaryDataService.deleteMany(idsForDeletion);
        this.eventService.emit('workflow-deleted', { user, workflowId, publicApi: false });
        await this.externalHooks.run('workflow.afterDelete', [workflowId]);
        return workflow;
    }
    async getWorkflowScopes(user, workflowId) {
        const userProjectRelations = await this.projectService.getProjectRelationsForUser(user);
        const shared = await this.sharedWorkflowRepository.find({
            where: {
                projectId: (0, typeorm_1.In)([...new Set(userProjectRelations.map((pr) => pr.projectId))]),
                workflowId,
            },
        });
        return this.roleService.combineResourceScopes('workflow', user, shared, userProjectRelations);
    }
    async transferAll(fromProjectId, toProjectId, trx) {
        trx = trx ?? this.workflowRepository.manager;
        const allSharedWorkflows = await trx.findBy(shared_workflow_1.SharedWorkflow, {
            projectId: (0, typeorm_1.In)([fromProjectId, toProjectId]),
        });
        const sharedWorkflowsOfFromProject = allSharedWorkflows.filter((sw) => sw.projectId === fromProjectId);
        const ownedWorkflowIds = sharedWorkflowsOfFromProject
            .filter((sw) => sw.role === 'workflow:owner')
            .map((sw) => sw.workflowId);
        await this.sharedWorkflowRepository.makeOwner(ownedWorkflowIds, toProjectId, trx);
        await this.sharedWorkflowRepository.deleteByIds(ownedWorkflowIds, fromProjectId, trx);
        const sharedWorkflowIdsOfTransferee = allSharedWorkflows
            .filter((sw) => sw.projectId === toProjectId)
            .map((sw) => sw.workflowId);
        const sharedWorkflowsToTransfer = sharedWorkflowsOfFromProject.filter((sw) => sw.role !== 'workflow:owner' && !sharedWorkflowIdsOfTransferee.includes(sw.workflowId));
        await trx.insert(shared_workflow_1.SharedWorkflow, sharedWorkflowsToTransfer.map((sw) => ({
            workflowId: sw.workflowId,
            projectId: toProjectId,
            role: sw.role,
        })));
    }
};
exports.WorkflowService = WorkflowService;
exports.WorkflowService = WorkflowService = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [logger_service_1.Logger,
        shared_workflow_repository_1.SharedWorkflowRepository,
        workflow_repository_1.WorkflowRepository,
        workflow_tag_mapping_repository_1.WorkflowTagMappingRepository,
        n8n_core_1.BinaryDataService,
        ownership_service_1.OwnershipService,
        tag_service_1.TagService,
        workflow_history_service_ee_1.WorkflowHistoryService,
        orchestration_service_1.OrchestrationService,
        external_hooks_1.ExternalHooks,
        active_workflow_manager_1.ActiveWorkflowManager,
        role_service_1.RoleService,
        workflow_sharing_service_1.WorkflowSharingService,
        project_service_1.ProjectService,
        execution_repository_1.ExecutionRepository,
        event_service_1.EventService])
], WorkflowService);
//# sourceMappingURL=workflow.service.js.map