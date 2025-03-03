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
exports.EnterpriseWorkflowService = void 0;
const typeorm_1 = require("@n8n/typeorm");
const omit_1 = __importDefault(require("lodash/omit"));
const n8n_workflow_1 = require("n8n-workflow");
const typedi_1 = require("typedi");
const active_workflow_manager_1 = require("../active-workflow-manager");
const credentials_service_1 = require("../credentials/credentials.service");
const project_1 = require("../databases/entities/project");
const shared_workflow_1 = require("../databases/entities/shared-workflow");
const credentials_repository_1 = require("../databases/repositories/credentials.repository");
const shared_workflow_repository_1 = require("../databases/repositories/shared-workflow.repository");
const workflow_repository_1 = require("../databases/repositories/workflow.repository");
const bad_request_error_1 = require("../errors/response-errors/bad-request.error");
const not_found_error_1 = require("../errors/response-errors/not-found.error");
const transfer_workflow_error_1 = require("../errors/response-errors/transfer-workflow.error");
const logger_service_1 = require("../logging/logger.service");
const ownership_service_1 = require("../services/ownership.service");
const project_service_1 = require("../services/project.service");
let EnterpriseWorkflowService = class EnterpriseWorkflowService {
    constructor(logger, sharedWorkflowRepository, workflowRepository, credentialsRepository, credentialsService, ownershipService, projectService, activeWorkflowManager) {
        this.logger = logger;
        this.sharedWorkflowRepository = sharedWorkflowRepository;
        this.workflowRepository = workflowRepository;
        this.credentialsRepository = credentialsRepository;
        this.credentialsService = credentialsService;
        this.ownershipService = ownershipService;
        this.projectService = projectService;
        this.activeWorkflowManager = activeWorkflowManager;
    }
    async shareWithProjects(workflow, shareWithIds, entityManager) {
        const em = entityManager ?? this.sharedWorkflowRepository.manager;
        const projects = await em.find(project_1.Project, {
            where: { id: (0, typeorm_1.In)(shareWithIds), type: 'personal' },
        });
        const newSharedWorkflows = projects
            .map((project) => this.sharedWorkflowRepository.create({
            workflowId: workflow.id,
            role: 'workflow:editor',
            projectId: project.id,
        }));
        return await em.save(newSharedWorkflows);
    }
    addOwnerAndSharings(workflow) {
        const workflowWithMetaData = this.ownershipService.addOwnedByAndSharedWith(workflow);
        return {
            ...workflow,
            ...workflowWithMetaData,
            usedCredentials: workflow.usedCredentials ?? [],
        };
    }
    async addCredentialsToWorkflow(workflow, currentUser) {
        workflow.usedCredentials = [];
        const userCredentials = await this.credentialsService.getCredentialsAUserCanUseInAWorkflow(currentUser, { workflowId: workflow.id });
        const credentialIdsUsedByWorkflow = new Set();
        workflow.nodes.forEach((node) => {
            if (!node.credentials) {
                return;
            }
            Object.keys(node.credentials).forEach((credentialType) => {
                const credential = node.credentials?.[credentialType];
                if (!credential?.id) {
                    return;
                }
                credentialIdsUsedByWorkflow.add(credential.id);
            });
        });
        const workflowCredentials = await this.credentialsRepository.getManyByIds(Array.from(credentialIdsUsedByWorkflow), { withSharings: true });
        const userCredentialIds = userCredentials.map((credential) => credential.id);
        workflowCredentials.forEach((credential) => {
            const credentialId = credential.id;
            const filledCred = this.ownershipService.addOwnedByAndSharedWith(credential);
            workflow.usedCredentials?.push({
                id: credentialId,
                name: credential.name,
                type: credential.type,
                currentUserHasAccess: userCredentialIds.includes(credentialId),
                homeProject: filledCred.homeProject,
                sharedWithProjects: filledCred.sharedWithProjects,
            });
        });
    }
    validateCredentialPermissionsToUser(workflow, allowedCredentials) {
        workflow.nodes.forEach((node) => {
            if (!node.credentials) {
                return;
            }
            Object.keys(node.credentials).forEach((credentialType) => {
                const credentialId = node.credentials?.[credentialType].id;
                if (credentialId === undefined)
                    return;
                const matchedCredential = allowedCredentials.find(({ id }) => id === credentialId);
                if (!matchedCredential) {
                    throw new n8n_workflow_1.ApplicationError('The workflow contains credentials that you do not have access to');
                }
            });
        });
    }
    async preventTampering(workflow, workflowId, user) {
        const previousVersion = await this.workflowRepository.get({ id: workflowId });
        if (!previousVersion) {
            throw new not_found_error_1.NotFoundError('Workflow not found');
        }
        const allCredentials = await this.credentialsService.getCredentialsAUserCanUseInAWorkflow(user, { workflowId });
        try {
            return this.validateWorkflowCredentialUsage(workflow, previousVersion, allCredentials);
        }
        catch (error) {
            if (error instanceof n8n_workflow_1.NodeOperationError) {
                throw new bad_request_error_1.BadRequestError(error.message);
            }
            throw new bad_request_error_1.BadRequestError('Invalid workflow credentials - make sure you have access to all credentials and try again.');
        }
    }
    validateWorkflowCredentialUsage(newWorkflowVersion, previousWorkflowVersion, credentialsUserHasAccessTo) {
        const allowedCredentialIds = credentialsUserHasAccessTo.map((cred) => cred.id);
        const nodesWithCredentialsUserDoesNotHaveAccessTo = this.getNodesWithInaccessibleCreds(newWorkflowVersion, allowedCredentialIds);
        if (nodesWithCredentialsUserDoesNotHaveAccessTo.length === 0) {
            return newWorkflowVersion;
        }
        const previouslyExistingNodeIds = previousWorkflowVersion.nodes.map((node) => node.id);
        const isTamperingAttempt = (inaccessibleCredNodeId) => !previouslyExistingNodeIds.includes(inaccessibleCredNodeId);
        nodesWithCredentialsUserDoesNotHaveAccessTo.forEach((node) => {
            if (isTamperingAttempt(node.id)) {
                this.logger.warn('Blocked workflow update due to tampering attempt', {
                    nodeType: node.type,
                    nodeName: node.name,
                    nodeId: node.id,
                    nodeCredentials: node.credentials,
                });
                throw new n8n_workflow_1.NodeOperationError(node, `You don't have access to the credentials in the '${node.name}' node. Ask the owner to share them with you.`);
            }
            const nodeIdx = newWorkflowVersion.nodes.findIndex((newWorkflowNode) => newWorkflowNode.id === node.id);
            this.logger.debug('Replacing node with previous version when saving updated workflow', {
                nodeType: node.type,
                nodeName: node.name,
                nodeId: node.id,
            });
            const previousNodeVersion = previousWorkflowVersion.nodes.find((previousNode) => previousNode.id === node.id);
            Object.assign(newWorkflowVersion.nodes[nodeIdx], (0, omit_1.default)(previousNodeVersion, ['name', 'position', 'disabled']));
        });
        return newWorkflowVersion;
    }
    getNodesWithInaccessibleCreds(workflow, userCredIds) {
        if (!workflow.nodes) {
            return [];
        }
        return workflow.nodes.filter((node) => {
            if (!node.credentials)
                return false;
            const allUsedCredentials = Object.values(node.credentials);
            const allUsedCredentialIds = allUsedCredentials.map((nodeCred) => nodeCred.id?.toString());
            return allUsedCredentialIds.some((nodeCredId) => nodeCredId && !userCredIds.includes(nodeCredId));
        });
    }
    async transferOne(user, workflowId, destinationProjectId) {
        const workflow = await this.sharedWorkflowRepository.findWorkflowForUser(workflowId, user, [
            'workflow:move',
        ]);
        not_found_error_1.NotFoundError.isDefinedAndNotNull(workflow, `Could not find workflow with the id "${workflowId}". Make sure you have the permission to move it.`);
        const ownerSharing = workflow.shared.find((s) => s.role === 'workflow:owner');
        not_found_error_1.NotFoundError.isDefinedAndNotNull(ownerSharing, `Could not find owner for workflow "${workflow.id}"`);
        const sourceProject = ownerSharing.project;
        const destinationProject = await this.projectService.getProjectWithScope(user, destinationProjectId, ['workflow:create']);
        not_found_error_1.NotFoundError.isDefinedAndNotNull(destinationProject, `Could not find project with the id "${destinationProjectId}". Make sure you have the permission to create workflows in it.`);
        if (sourceProject.id === destinationProject.id) {
            throw new transfer_workflow_error_1.TransferWorkflowError("You can't transfer a workflow into the project that's already owning it.");
        }
        const wasActive = workflow.active;
        if (wasActive) {
            await this.activeWorkflowManager.remove(workflowId);
        }
        await this.workflowRepository.manager.transaction(async (trx) => {
            await trx.remove(workflow.shared);
            await trx.save(trx.create(shared_workflow_1.SharedWorkflow, {
                workflowId: workflow.id,
                projectId: destinationProject.id,
                role: 'workflow:owner',
            }));
        });
        if (wasActive) {
            try {
                await this.activeWorkflowManager.add(workflowId, 'update');
                return;
            }
            catch (error) {
                await this.workflowRepository.updateActiveState(workflowId, false);
                if (error instanceof n8n_workflow_1.WorkflowActivationError) {
                    return {
                        error: error.toJSON
                            ? error.toJSON()
                            : {
                                name: error.name,
                                message: error.message,
                            },
                    };
                }
                throw error;
            }
        }
        return;
    }
};
exports.EnterpriseWorkflowService = EnterpriseWorkflowService;
exports.EnterpriseWorkflowService = EnterpriseWorkflowService = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [logger_service_1.Logger,
        shared_workflow_repository_1.SharedWorkflowRepository,
        workflow_repository_1.WorkflowRepository,
        credentials_repository_1.CredentialsRepository,
        credentials_service_1.CredentialsService,
        ownership_service_1.OwnershipService,
        project_service_1.ProjectService,
        active_workflow_manager_1.ActiveWorkflowManager])
], EnterpriseWorkflowService);
//# sourceMappingURL=workflow.service.ee.js.map