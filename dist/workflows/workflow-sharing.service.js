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
exports.WorkflowSharingService = void 0;
const typeorm_1 = require("@n8n/typeorm");
const typedi_1 = require("typedi");
const project_relation_repository_1 = require("../databases/repositories/project-relation.repository");
const shared_workflow_repository_1 = require("../databases/repositories/shared-workflow.repository");
const role_service_1 = require("../services/role.service");
let WorkflowSharingService = class WorkflowSharingService {
    constructor(sharedWorkflowRepository, roleService, projectRelationRepository) {
        this.sharedWorkflowRepository = sharedWorkflowRepository;
        this.roleService = roleService;
        this.projectRelationRepository = projectRelationRepository;
    }
    async getSharedWorkflowIds(user, options) {
        const { projectId } = options;
        if (user.hasGlobalScope('workflow:read')) {
            const sharedWorkflows = await this.sharedWorkflowRepository.find({
                select: ['workflowId'],
                ...(projectId && { where: { projectId } }),
            });
            return sharedWorkflows.map(({ workflowId }) => workflowId);
        }
        const projectRoles = 'scopes' in options
            ? this.roleService.rolesWithScope('project', options.scopes)
            : options.projectRoles;
        const workflowRoles = 'scopes' in options
            ? this.roleService.rolesWithScope('workflow', options.scopes)
            : options.workflowRoles;
        const sharedWorkflows = await this.sharedWorkflowRepository.find({
            where: {
                role: (0, typeorm_1.In)(workflowRoles),
                project: {
                    projectRelations: {
                        userId: user.id,
                        role: (0, typeorm_1.In)(projectRoles),
                    },
                },
            },
            select: ['workflowId'],
        });
        return sharedWorkflows.map(({ workflowId }) => workflowId);
    }
    async getSharedWorkflowScopes(workflowIds, user) {
        const projectRelations = await this.projectRelationRepository.findAllByUser(user.id);
        const sharedWorkflows = await this.sharedWorkflowRepository.getRelationsByWorkflowIdsAndProjectIds(workflowIds, projectRelations.map((p) => p.projectId));
        return workflowIds.map((workflowId) => {
            return [
                workflowId,
                this.roleService.combineResourceScopes('workflow', user, sharedWorkflows.filter((s) => s.workflowId === workflowId), projectRelations),
            ];
        });
    }
};
exports.WorkflowSharingService = WorkflowSharingService;
exports.WorkflowSharingService = WorkflowSharingService = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [shared_workflow_repository_1.SharedWorkflowRepository,
        role_service_1.RoleService,
        project_relation_repository_1.ProjectRelationRepository])
], WorkflowSharingService);
//# sourceMappingURL=workflow-sharing.service.js.map