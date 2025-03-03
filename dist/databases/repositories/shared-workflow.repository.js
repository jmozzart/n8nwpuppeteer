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
exports.SharedWorkflowRepository = void 0;
const typeorm_1 = require("@n8n/typeorm");
const typedi_1 = require("typedi");
const role_service_1 = require("../../services/role.service");
const shared_workflow_1 = require("../entities/shared-workflow");
let SharedWorkflowRepository = class SharedWorkflowRepository extends typeorm_1.Repository {
    constructor(dataSource, roleService) {
        super(shared_workflow_1.SharedWorkflow, dataSource.manager);
        this.roleService = roleService;
    }
    async getSharedWorkflowIds(workflowIds) {
        const sharedWorkflows = await this.find({
            select: ['workflowId'],
            where: {
                workflowId: (0, typeorm_1.In)(workflowIds),
            },
        });
        return sharedWorkflows.map((sharing) => sharing.workflowId);
    }
    async findByWorkflowIds(workflowIds) {
        return await this.find({
            where: {
                role: 'workflow:owner',
                workflowId: (0, typeorm_1.In)(workflowIds),
            },
            relations: { project: { projectRelations: { user: true } } },
        });
    }
    async findSharingRole(userId, workflowId) {
        const sharing = await this.findOne({
            select: {
                role: true,
                workflowId: true,
                projectId: true,
            },
            where: {
                workflowId,
                project: { projectRelations: { role: 'project:personalOwner', userId } },
            },
        });
        return sharing?.role;
    }
    async makeOwnerOfAllWorkflows(project) {
        return await this.update({
            projectId: (0, typeorm_1.Not)(project.id),
            role: 'workflow:owner',
        }, { project });
    }
    async makeOwner(workflowIds, projectId, trx) {
        trx = trx ?? this.manager;
        return await trx.upsert(shared_workflow_1.SharedWorkflow, workflowIds.map((workflowId) => ({
            workflowId,
            projectId,
            role: 'workflow:owner',
        })), ['projectId', 'workflowId']);
    }
    async findWithFields(workflowIds, { select }) {
        return await this.find({
            where: {
                workflowId: (0, typeorm_1.In)(workflowIds),
            },
            select,
        });
    }
    async deleteByIds(sharedWorkflowIds, projectId, trx) {
        trx = trx ?? this.manager;
        return await trx.delete(shared_workflow_1.SharedWorkflow, {
            projectId,
            workflowId: (0, typeorm_1.In)(sharedWorkflowIds),
        });
    }
    async findWorkflowForUser(workflowId, user, scopes, { includeTags = false, em = this.manager } = {}) {
        let where = { workflowId };
        if (!user.hasGlobalScope(scopes, { mode: 'allOf' })) {
            const projectRoles = this.roleService.rolesWithScope('project', scopes);
            const workflowRoles = this.roleService.rolesWithScope('workflow', scopes);
            where = {
                ...where,
                role: (0, typeorm_1.In)(workflowRoles),
                project: {
                    projectRelations: {
                        role: (0, typeorm_1.In)(projectRoles),
                        userId: user.id,
                    },
                },
            };
        }
        const sharedWorkflow = await em.findOne(shared_workflow_1.SharedWorkflow, {
            where,
            relations: {
                workflow: {
                    shared: { project: { projectRelations: { user: true } } },
                    tags: includeTags,
                },
            },
        });
        if (!sharedWorkflow) {
            return null;
        }
        return sharedWorkflow.workflow;
    }
    async findAllWorkflowsForUser(user, scopes) {
        let where = {};
        if (!user.hasGlobalScope(scopes, { mode: 'allOf' })) {
            const projectRoles = this.roleService.rolesWithScope('project', scopes);
            const workflowRoles = this.roleService.rolesWithScope('workflow', scopes);
            where = {
                ...where,
                role: (0, typeorm_1.In)(workflowRoles),
                project: {
                    projectRelations: {
                        role: (0, typeorm_1.In)(projectRoles),
                        userId: user.id,
                    },
                },
            };
        }
        const sharedWorkflows = await this.find({
            where,
            relations: {
                workflow: {
                    shared: { project: { projectRelations: { user: true } } },
                },
            },
        });
        return sharedWorkflows.map((sw) => ({ ...sw.workflow, projectId: sw.projectId }));
    }
    async findProjectIds(workflowId) {
        const rows = await this.find({ where: { workflowId }, select: ['projectId'] });
        const projectIds = rows.reduce((acc, row) => {
            if (row.projectId)
                acc.push(row.projectId);
            return acc;
        }, []);
        return [...new Set(projectIds)];
    }
    async getWorkflowOwningProject(workflowId) {
        return (await this.findOne({
            where: { workflowId, role: 'workflow:owner' },
            relations: { project: true },
        }))?.project;
    }
    async getRelationsByWorkflowIdsAndProjectIds(workflowIds, projectIds) {
        return await this.find({
            where: {
                workflowId: (0, typeorm_1.In)(workflowIds),
                projectId: (0, typeorm_1.In)(projectIds),
            },
        });
    }
};
exports.SharedWorkflowRepository = SharedWorkflowRepository;
exports.SharedWorkflowRepository = SharedWorkflowRepository = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource,
        role_service_1.RoleService])
], SharedWorkflowRepository);
//# sourceMappingURL=shared-workflow.repository.js.map