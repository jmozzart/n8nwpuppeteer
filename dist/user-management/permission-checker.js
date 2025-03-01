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
exports.PermissionChecker = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const typedi_1 = require("typedi");
const shared_credentials_repository_1 = require("../databases/repositories/shared-credentials.repository");
const ownership_service_1 = require("../services/ownership.service");
const project_service_1 = require("../services/project.service");
let PermissionChecker = class PermissionChecker {
    constructor(sharedCredentialsRepository, ownershipService, projectService) {
        this.sharedCredentialsRepository = sharedCredentialsRepository;
        this.ownershipService = ownershipService;
        this.projectService = projectService;
    }
    async check(workflowId, nodes) {
        const homeProject = await this.ownershipService.getWorkflowProjectCached(workflowId);
        const homeProjectOwner = await this.ownershipService.getPersonalProjectOwnerCached(homeProject.id);
        if (homeProject.type === 'personal' && homeProjectOwner?.hasGlobalScope('credential:list')) {
            return;
        }
        const projectIds = await this.projectService.findProjectsWorkflowIsIn(workflowId);
        const credIdsToNodes = this.mapCredIdsToNodes(nodes);
        const workflowCredIds = Object.keys(credIdsToNodes);
        if (workflowCredIds.length === 0)
            return;
        const accessible = await this.sharedCredentialsRepository.getFilteredAccessibleCredentials(projectIds, workflowCredIds);
        for (const credentialsId of workflowCredIds) {
            if (!accessible.includes(credentialsId)) {
                const nodeToFlag = credIdsToNodes[credentialsId][0];
                throw new n8n_workflow_1.CredentialAccessError(nodeToFlag, credentialsId, workflowId);
            }
        }
    }
    mapCredIdsToNodes(nodes) {
        return nodes.reduce((map, node) => {
            if (node.disabled || !node.credentials)
                return map;
            Object.values(node.credentials).forEach((cred) => {
                if (!cred.id) {
                    throw new n8n_workflow_1.NodeOperationError(node, 'Node uses invalid credential', {
                        description: 'Please recreate the credential.',
                        level: 'warning',
                    });
                }
                map[cred.id] = map[cred.id] ? [...map[cred.id], node] : [node];
            });
            return map;
        }, {});
    }
};
exports.PermissionChecker = PermissionChecker;
exports.PermissionChecker = PermissionChecker = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [shared_credentials_repository_1.SharedCredentialsRepository,
        ownership_service_1.OwnershipService,
        project_service_1.ProjectService])
], PermissionChecker);
//# sourceMappingURL=permission-checker.js.map