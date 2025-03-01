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
exports.WorkflowsController = void 0;
const config_1 = require("@n8n/config");
const typeorm_1 = require("@n8n/typeorm");
const axios_1 = __importDefault(require("axios"));
const express_1 = __importDefault(require("express"));
const n8n_workflow_1 = require("n8n-workflow");
const uuid_1 = require("uuid");
const zod_1 = require("zod");
const config_2 = __importDefault(require("../config"));
const shared_workflow_1 = require("../databases/entities/shared-workflow");
const workflow_entity_1 = require("../databases/entities/workflow-entity");
const project_relation_repository_1 = require("../databases/repositories/project-relation.repository");
const project_repository_1 = require("../databases/repositories/project.repository");
const shared_workflow_repository_1 = require("../databases/repositories/shared-workflow.repository");
const tag_repository_1 = require("../databases/repositories/tag.repository");
const workflow_repository_1 = require("../databases/repositories/workflow.repository");
const Db = __importStar(require("../db"));
const decorators_1 = require("../decorators");
const bad_request_error_1 = require("../errors/response-errors/bad-request.error");
const forbidden_error_1 = require("../errors/response-errors/forbidden.error");
const internal_server_error_1 = require("../errors/response-errors/internal-server.error");
const not_found_error_1 = require("../errors/response-errors/not-found.error");
const event_service_1 = require("../events/event.service");
const external_hooks_1 = require("../external-hooks");
const generic_helpers_1 = require("../generic-helpers");
const license_1 = require("../license");
const logger_service_1 = require("../logging/logger.service");
const middlewares_1 = require("../middlewares");
const ResponseHelper = __importStar(require("../response-helper"));
const naming_service_1 = require("../services/naming.service");
const project_service_1 = require("../services/project.service");
const tag_service_1 = require("../services/tag.service");
const user_onboarding_service_1 = require("../services/user-onboarding.service");
const email_1 = require("../user-management/email");
const utils = __importStar(require("../utils"));
const WorkflowHelpers = __importStar(require("../workflow-helpers"));
const workflow_execution_service_1 = require("./workflow-execution.service");
const workflow_history_service_ee_1 = require("./workflow-history/workflow-history.service.ee");
const workflow_service_1 = require("./workflow.service");
const workflow_service_ee_1 = require("./workflow.service.ee");
const credentials_service_1 = require("../credentials/credentials.service");
let WorkflowsController = class WorkflowsController {
    constructor(logger, externalHooks, tagRepository, enterpriseWorkflowService, workflowHistoryService, tagService, namingService, userOnboardingService, workflowRepository, workflowService, workflowExecutionService, sharedWorkflowRepository, license, mailer, credentialsService, projectRepository, projectService, projectRelationRepository, eventService, globalConfig) {
        this.logger = logger;
        this.externalHooks = externalHooks;
        this.tagRepository = tagRepository;
        this.enterpriseWorkflowService = enterpriseWorkflowService;
        this.workflowHistoryService = workflowHistoryService;
        this.tagService = tagService;
        this.namingService = namingService;
        this.userOnboardingService = userOnboardingService;
        this.workflowRepository = workflowRepository;
        this.workflowService = workflowService;
        this.workflowExecutionService = workflowExecutionService;
        this.sharedWorkflowRepository = sharedWorkflowRepository;
        this.license = license;
        this.mailer = mailer;
        this.credentialsService = credentialsService;
        this.projectRepository = projectRepository;
        this.projectService = projectService;
        this.projectRelationRepository = projectRelationRepository;
        this.eventService = eventService;
        this.globalConfig = globalConfig;
    }
    async create(req) {
        delete req.body.id;
        delete req.body.shared;
        const newWorkflow = new workflow_entity_1.WorkflowEntity();
        Object.assign(newWorkflow, req.body);
        newWorkflow.versionId = (0, uuid_1.v4)();
        await (0, generic_helpers_1.validateEntity)(newWorkflow);
        await this.externalHooks.run('workflow.create', [newWorkflow]);
        const { tags: tagIds } = req.body;
        if (tagIds?.length && !config_2.default.getEnv('workflowTagsDisabled')) {
            newWorkflow.tags = await this.tagRepository.findMany(tagIds);
        }
        await WorkflowHelpers.replaceInvalidCredentials(newWorkflow);
        WorkflowHelpers.addNodeIds(newWorkflow);
        if (this.license.isSharingEnabled()) {
            const allCredentials = await this.credentialsService.getMany(req.user);
            try {
                this.enterpriseWorkflowService.validateCredentialPermissionsToUser(newWorkflow, allCredentials);
            }
            catch (error) {
                throw new bad_request_error_1.BadRequestError('The workflow you are trying to save contains credentials that are not shared with you');
            }
        }
        let project;
        const savedWorkflow = await Db.transaction(async (transactionManager) => {
            const workflow = await transactionManager.save(newWorkflow);
            const { projectId } = req.body;
            project =
                projectId === undefined
                    ? await this.projectRepository.getPersonalProjectForUser(req.user.id, transactionManager)
                    : await this.projectService.getProjectWithScope(req.user, projectId, ['workflow:create'], transactionManager);
            if (typeof projectId === 'string' && project === null) {
                throw new bad_request_error_1.BadRequestError("You don't have the permissions to save the workflow in this project.");
            }
            if (project === null) {
                throw new n8n_workflow_1.ApplicationError('No personal project found');
            }
            const newSharedWorkflow = this.sharedWorkflowRepository.create({
                role: 'workflow:owner',
                projectId: project.id,
                workflow,
            });
            await transactionManager.save(newSharedWorkflow);
            return await this.sharedWorkflowRepository.findWorkflowForUser(workflow.id, req.user, ['workflow:read'], { em: transactionManager, includeTags: true });
        });
        if (!savedWorkflow) {
            this.logger.error('Failed to create workflow', { userId: req.user.id });
            throw new internal_server_error_1.InternalServerError('Failed to save workflow');
        }
        await this.workflowHistoryService.saveVersion(req.user, savedWorkflow, savedWorkflow.id);
        if (tagIds && !config_2.default.getEnv('workflowTagsDisabled') && savedWorkflow.tags) {
            savedWorkflow.tags = this.tagService.sortByRequestOrder(savedWorkflow.tags, {
                requestOrder: tagIds,
            });
        }
        const savedWorkflowWithMetaData = this.enterpriseWorkflowService.addOwnerAndSharings(savedWorkflow);
        delete savedWorkflowWithMetaData.shared;
        await this.externalHooks.run('workflow.afterCreate', [savedWorkflow]);
        this.eventService.emit('workflow-created', {
            user: req.user,
            workflow: newWorkflow,
            publicApi: false,
            projectId: project.id,
            projectType: project.type,
        });
        const scopes = await this.workflowService.getWorkflowScopes(req.user, savedWorkflow.id);
        return { ...savedWorkflowWithMetaData, scopes };
    }
    async getAll(req, res) {
        try {
            const { workflows: data, count } = await this.workflowService.getMany(req.user, req.listQueryOptions, !!req.query.includeScopes);
            res.json({ count, data });
        }
        catch (maybeError) {
            const error = utils.toError(maybeError);
            ResponseHelper.reportError(error);
            ResponseHelper.sendErrorResponse(res, error);
        }
    }
    async getNewName(req) {
        const requestedName = req.query.name ?? this.globalConfig.workflows.defaultName;
        const name = await this.namingService.getUniqueWorkflowName(requestedName);
        const onboardingFlowEnabled = !this.globalConfig.workflows.onboardingFlowDisabled &&
            !req.user.settings?.isOnboarded &&
            (await this.userOnboardingService.isBelowThreshold(req.user));
        return { name, onboardingFlowEnabled };
    }
    async getFromUrl(req) {
        if (req.query.url === undefined) {
            throw new bad_request_error_1.BadRequestError('The parameter "url" is missing!');
        }
        if (!/^http[s]?:\/\/.*\.json$/i.exec(req.query.url)) {
            throw new bad_request_error_1.BadRequestError('The parameter "url" is not valid! It does not seem to be a URL pointing to a n8n workflow JSON file.');
        }
        let workflowData;
        try {
            const { data } = await axios_1.default.get(req.query.url);
            workflowData = data;
        }
        catch (error) {
            throw new bad_request_error_1.BadRequestError('The URL does not point to valid JSON file!');
        }
        if (workflowData?.nodes === undefined ||
            !Array.isArray(workflowData.nodes) ||
            workflowData.connections === undefined ||
            typeof workflowData.connections !== 'object' ||
            Array.isArray(workflowData.connections)) {
            throw new bad_request_error_1.BadRequestError('The data in the file does not seem to be a n8n workflow JSON file!');
        }
        return workflowData;
    }
    async getWorkflow(req) {
        const { workflowId } = req.params;
        if (this.license.isSharingEnabled()) {
            const relations = {
                shared: {
                    project: {
                        projectRelations: true,
                    },
                },
            };
            if (!config_2.default.getEnv('workflowTagsDisabled')) {
                relations.tags = true;
            }
            const workflow = await this.sharedWorkflowRepository.findWorkflowForUser(workflowId, req.user, ['workflow:read'], { includeTags: !config_2.default.getEnv('workflowTagsDisabled') });
            if (!workflow) {
                throw new not_found_error_1.NotFoundError(`Workflow with ID "${workflowId}" does not exist`);
            }
            const enterpriseWorkflowService = this.enterpriseWorkflowService;
            const workflowWithMetaData = enterpriseWorkflowService.addOwnerAndSharings(workflow);
            await enterpriseWorkflowService.addCredentialsToWorkflow(workflowWithMetaData, req.user);
            delete workflowWithMetaData.shared;
            const scopes = await this.workflowService.getWorkflowScopes(req.user, workflowId);
            return { ...workflowWithMetaData, scopes };
        }
        const workflow = await this.sharedWorkflowRepository.findWorkflowForUser(workflowId, req.user, ['workflow:read'], { includeTags: !config_2.default.getEnv('workflowTagsDisabled') });
        if (!workflow) {
            this.logger.warn('User attempted to access a workflow without permissions', {
                workflowId,
                userId: req.user.id,
            });
            throw new not_found_error_1.NotFoundError('Could not load the workflow - you can only access workflows owned by you');
        }
        const scopes = await this.workflowService.getWorkflowScopes(req.user, workflowId);
        return { ...workflow, scopes };
    }
    async update(req) {
        const { workflowId } = req.params;
        const forceSave = req.query.forceSave === 'true';
        let updateData = new workflow_entity_1.WorkflowEntity();
        const { tags, ...rest } = req.body;
        Object.assign(updateData, rest);
        const isSharingEnabled = this.license.isSharingEnabled();
        if (isSharingEnabled) {
            updateData = await this.enterpriseWorkflowService.preventTampering(updateData, workflowId, req.user);
        }
        const updatedWorkflow = await this.workflowService.update(req.user, updateData, workflowId, tags, isSharingEnabled ? forceSave : true);
        const scopes = await this.workflowService.getWorkflowScopes(req.user, workflowId);
        return { ...updatedWorkflow, scopes };
    }
    async delete(req) {
        const { workflowId } = req.params;
        const workflow = await this.workflowService.delete(req.user, workflowId);
        if (!workflow) {
            this.logger.warn('User attempted to delete a workflow without permissions', {
                workflowId,
                userId: req.user.id,
            });
            throw new bad_request_error_1.BadRequestError('Could not delete the workflow - you can only remove workflows owned by you');
        }
        return true;
    }
    async runManually(req) {
        if (!req.body.workflowData.id) {
            throw new n8n_workflow_1.ApplicationError('You cannot execute a workflow without an ID', {
                level: 'warning',
            });
        }
        if (req.params.workflowId !== req.body.workflowData.id) {
            throw new n8n_workflow_1.ApplicationError('Workflow ID in body does not match workflow ID in URL', {
                level: 'warning',
            });
        }
        if (this.license.isSharingEnabled()) {
            const workflow = this.workflowRepository.create(req.body.workflowData);
            const safeWorkflow = await this.enterpriseWorkflowService.preventTampering(workflow, workflow.id, req.user);
            req.body.workflowData.nodes = safeWorkflow.nodes;
        }
        return await this.workflowExecutionService.executeManually(req.body, req.user, req.headers['push-ref'], req.query.partialExecutionVersion === '-1'
            ? config_2.default.getEnv('featureFlags.partialExecutionVersionDefault')
            : req.query.partialExecutionVersion);
    }
    async share(req) {
        if (!this.license.isSharingEnabled())
            throw new not_found_error_1.NotFoundError('Route not found');
        const { workflowId } = req.params;
        const { shareWithIds } = req.body;
        if (!Array.isArray(shareWithIds) ||
            !shareWithIds.every((userId) => typeof userId === 'string')) {
            throw new bad_request_error_1.BadRequestError('Bad request');
        }
        const workflow = await this.sharedWorkflowRepository.findWorkflowForUser(workflowId, req.user, [
            'workflow:share',
        ]);
        if (!workflow) {
            throw new forbidden_error_1.ForbiddenError();
        }
        let newShareeIds = [];
        await Db.transaction(async (trx) => {
            const currentPersonalProjectIDs = workflow.shared
                .filter((sw) => sw.role === 'workflow:editor')
                .map((sw) => sw.projectId);
            const newPersonalProjectIDs = shareWithIds;
            const toShare = utils.rightDiff([currentPersonalProjectIDs, (id) => id], [newPersonalProjectIDs, (id) => id]);
            const toUnshare = utils.rightDiff([newPersonalProjectIDs, (id) => id], [currentPersonalProjectIDs, (id) => id]);
            await trx.delete(shared_workflow_1.SharedWorkflow, {
                workflowId,
                projectId: (0, typeorm_1.In)(toUnshare),
            });
            await this.enterpriseWorkflowService.shareWithProjects(workflow, toShare, trx);
            newShareeIds = toShare;
        });
        this.eventService.emit('workflow-sharing-updated', {
            workflowId,
            userIdSharer: req.user.id,
            userIdList: shareWithIds,
        });
        const projectsRelations = await this.projectRelationRepository.findBy({
            projectId: (0, typeorm_1.In)(newShareeIds),
            role: 'project:personalOwner',
        });
        await this.mailer.notifyWorkflowShared({
            sharer: req.user,
            newShareeIds: projectsRelations.map((pr) => pr.userId),
            workflow,
        });
    }
    async transfer(req) {
        const body = zod_1.z.object({ destinationProjectId: zod_1.z.string() }).parse(req.body);
        return await this.enterpriseWorkflowService.transferOne(req.user, req.params.workflowId, body.destinationProjectId);
    }
};
exports.WorkflowsController = WorkflowsController;
__decorate([
    (0, decorators_1.Post)('/'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "create", null);
__decorate([
    (0, decorators_1.Get)('/', { middlewares: middlewares_1.listQueryMiddleware }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "getAll", null);
__decorate([
    (0, decorators_1.Get)('/new'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "getNewName", null);
__decorate([
    (0, decorators_1.Get)('/from-url'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "getFromUrl", null);
__decorate([
    (0, decorators_1.Get)('/:workflowId'),
    (0, decorators_1.ProjectScope)('workflow:read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "getWorkflow", null);
__decorate([
    (0, decorators_1.Patch)('/:workflowId'),
    (0, decorators_1.ProjectScope)('workflow:update'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "update", null);
__decorate([
    (0, decorators_1.Delete)('/:workflowId'),
    (0, decorators_1.ProjectScope)('workflow:delete'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "delete", null);
__decorate([
    (0, decorators_1.Post)('/:workflowId/run'),
    (0, decorators_1.ProjectScope)('workflow:execute'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "runManually", null);
__decorate([
    (0, decorators_1.Put)('/:workflowId/share'),
    (0, decorators_1.ProjectScope)('workflow:share'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "share", null);
__decorate([
    (0, decorators_1.Put)('/:workflowId/transfer'),
    (0, decorators_1.ProjectScope)('workflow:move'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "transfer", null);
exports.WorkflowsController = WorkflowsController = __decorate([
    (0, decorators_1.RestController)('/workflows'),
    __metadata("design:paramtypes", [logger_service_1.Logger,
        external_hooks_1.ExternalHooks,
        tag_repository_1.TagRepository,
        workflow_service_ee_1.EnterpriseWorkflowService,
        workflow_history_service_ee_1.WorkflowHistoryService,
        tag_service_1.TagService,
        naming_service_1.NamingService,
        user_onboarding_service_1.UserOnboardingService,
        workflow_repository_1.WorkflowRepository,
        workflow_service_1.WorkflowService,
        workflow_execution_service_1.WorkflowExecutionService,
        shared_workflow_repository_1.SharedWorkflowRepository,
        license_1.License,
        email_1.UserManagementMailer,
        credentials_service_1.CredentialsService,
        project_repository_1.ProjectRepository,
        project_service_1.ProjectService,
        project_relation_repository_1.ProjectRelationRepository,
        event_service_1.EventService,
        config_1.GlobalConfig])
], WorkflowsController);
//# sourceMappingURL=workflows.controller.js.map