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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectService = exports.UnlicensedProjectRoleError = exports.TeamProjectOverQuotaError = void 0;
const typeorm_1 = require("@n8n/typeorm");
const n8n_workflow_1 = require("n8n-workflow");
const typedi_1 = __importStar(require("typedi"));
const constants_1 = require("../constants");
const project_1 = require("../databases/entities/project");
const project_relation_1 = require("../databases/entities/project-relation");
const project_relation_repository_1 = require("../databases/repositories/project-relation.repository");
const project_repository_1 = require("../databases/repositories/project.repository");
const shared_credentials_repository_1 = require("../databases/repositories/shared-credentials.repository");
const shared_workflow_repository_1 = require("../databases/repositories/shared-workflow.repository");
const bad_request_error_1 = require("../errors/response-errors/bad-request.error");
const forbidden_error_1 = require("../errors/response-errors/forbidden.error");
const not_found_error_1 = require("../errors/response-errors/not-found.error");
const license_1 = require("../license");
const cache_service_1 = require("./cache/cache.service");
const role_service_1 = require("./role.service");
class TeamProjectOverQuotaError extends n8n_workflow_1.ApplicationError {
    constructor(limit) {
        super(`Attempted to create a new project but quota is already exhausted. You may have a maximum of ${limit} team projects.`);
    }
}
exports.TeamProjectOverQuotaError = TeamProjectOverQuotaError;
class UnlicensedProjectRoleError extends n8n_workflow_1.ApplicationError {
    constructor(role) {
        super(`Your instance is not licensed to use role "${role}".`);
    }
}
exports.UnlicensedProjectRoleError = UnlicensedProjectRoleError;
let ProjectService = class ProjectService {
    constructor(sharedWorkflowRepository, projectRepository, projectRelationRepository, roleService, sharedCredentialsRepository, cacheService, license) {
        this.sharedWorkflowRepository = sharedWorkflowRepository;
        this.projectRepository = projectRepository;
        this.projectRelationRepository = projectRelationRepository;
        this.roleService = roleService;
        this.sharedCredentialsRepository = sharedCredentialsRepository;
        this.cacheService = cacheService;
        this.license = license;
    }
    get workflowService() {
        return Promise.resolve().then(() => __importStar(require('../workflows/workflow.service'))).then(({ WorkflowService }) => typedi_1.default.get(WorkflowService));
    }
    get credentialsService() {
        return Promise.resolve().then(() => __importStar(require('../credentials/credentials.service'))).then(({ CredentialsService }) => typedi_1.default.get(CredentialsService));
    }
    async deleteProject(user, projectId, { migrateToProject } = {}) {
        const workflowService = await this.workflowService;
        const credentialsService = await this.credentialsService;
        if (projectId === migrateToProject) {
            throw new bad_request_error_1.BadRequestError('Request to delete a project failed because the project to delete and the project to migrate to are the same project');
        }
        const project = await this.getProjectWithScope(user, projectId, ['project:delete']);
        if (!project) {
            throw new not_found_error_1.NotFoundError(`Could not find project with ID: ${projectId}`);
        }
        let targetProject = null;
        if (migrateToProject) {
            targetProject = await this.getProjectWithScope(user, migrateToProject, [
                'credential:create',
                'workflow:create',
            ]);
            if (!targetProject) {
                throw new not_found_error_1.NotFoundError(`Could not find project to migrate to. ID: ${targetProject}. You may lack permissions to create workflow and credentials in the target project.`);
            }
        }
        if (project.type !== 'team') {
            throw new forbidden_error_1.ForbiddenError(`Can't delete project. Project with ID "${projectId}" is not a team project.`);
        }
        const ownedSharedWorkflows = await this.sharedWorkflowRepository.find({
            where: { projectId: project.id, role: 'workflow:owner' },
        });
        if (targetProject) {
            await this.sharedWorkflowRepository.makeOwner(ownedSharedWorkflows.map((sw) => sw.workflowId), targetProject.id);
        }
        else {
            for (const sharedWorkflow of ownedSharedWorkflows) {
                await workflowService.delete(user, sharedWorkflow.workflowId);
            }
        }
        const ownedCredentials = await this.sharedCredentialsRepository.find({
            where: { projectId: project.id, role: 'credential:owner' },
            relations: { credentials: true },
        });
        if (targetProject) {
            await this.sharedCredentialsRepository.makeOwner(ownedCredentials.map((sc) => sc.credentialsId), targetProject.id);
        }
        else {
            for (const sharedCredential of ownedCredentials) {
                await credentialsService.delete(sharedCredential.credentials);
            }
        }
        await this.projectRepository.remove(project);
    }
    async findProjectsWorkflowIsIn(workflowId) {
        return await this.sharedWorkflowRepository.findProjectIds(workflowId);
    }
    async getAccessibleProjects(user) {
        if (user.hasGlobalScope('project:read')) {
            return await this.projectRepository.find();
        }
        return await this.projectRepository.getAccessibleProjects(user.id);
    }
    async getPersonalProjectOwners(projectIds) {
        return await this.projectRelationRepository.getPersonalProjectOwners(projectIds);
    }
    async createTeamProject(name, adminUser, id) {
        const limit = this.license.getTeamProjectLimit();
        if (limit !== constants_1.UNLIMITED_LICENSE_QUOTA &&
            limit <= (await this.projectRepository.count({ where: { type: 'team' } }))) {
            throw new TeamProjectOverQuotaError(limit);
        }
        const project = await this.projectRepository.save(this.projectRepository.create({
            id,
            name,
            type: 'team',
        }));
        await this.addUser(project.id, adminUser.id, 'project:admin');
        return project;
    }
    async updateProject(name, projectId) {
        const result = await this.projectRepository.update({
            id: projectId,
            type: 'team',
        }, {
            name,
        });
        if (!result.affected) {
            throw new forbidden_error_1.ForbiddenError('Project not found');
        }
        return await this.projectRepository.findOneByOrFail({ id: projectId });
    }
    async getPersonalProject(user) {
        return await this.projectRepository.getPersonalProjectForUser(user.id);
    }
    async getProjectRelationsForUser(user) {
        return await this.projectRelationRepository.find({
            where: { userId: user.id },
            relations: ['project'],
        });
    }
    async syncProjectRelations(projectId, relations) {
        const project = await this.projectRepository.findOneOrFail({
            where: { id: projectId, type: (0, typeorm_1.Not)('personal') },
            relations: { projectRelations: true },
        });
        for (const r of relations) {
            const existing = project.projectRelations.find((pr) => pr.userId === r.userId);
            if (existing?.role !== r.role && !this.roleService.isRoleLicensed(r.role)) {
                throw new UnlicensedProjectRoleError(r.role);
            }
        }
        await this.projectRelationRepository.manager.transaction(async (em) => {
            await this.pruneRelations(em, project);
            await this.addManyRelations(em, project, relations);
        });
        await this.clearCredentialCanUseExternalSecretsCache(projectId);
    }
    async clearCredentialCanUseExternalSecretsCache(projectId) {
        const shares = await this.sharedCredentialsRepository.find({
            where: {
                projectId,
                role: 'credential:owner',
            },
            select: ['credentialsId'],
        });
        if (shares.length) {
            await this.cacheService.deleteMany(shares.map((share) => `credential-can-use-secrets:${share.credentialsId}`));
        }
    }
    async pruneRelations(em, project) {
        await em.delete(project_relation_1.ProjectRelation, { projectId: project.id });
    }
    async addManyRelations(em, project, relations) {
        await em.insert(project_relation_1.ProjectRelation, relations.map((v) => this.projectRelationRepository.create({
            projectId: project.id,
            userId: v.userId,
            role: v.role,
        })));
    }
    async getProjectWithScope(user, projectId, scopes, entityManager) {
        const em = entityManager ?? this.projectRepository.manager;
        let where = {
            id: projectId,
        };
        if (!user.hasGlobalScope(scopes, { mode: 'allOf' })) {
            const projectRoles = this.roleService.rolesWithScope('project', scopes);
            where = {
                ...where,
                projectRelations: {
                    role: (0, typeorm_1.In)(projectRoles),
                    userId: user.id,
                },
            };
        }
        return await em.findOne(project_1.Project, {
            where,
        });
    }
    async addUser(projectId, userId, role) {
        return await this.projectRelationRepository.save({
            projectId,
            userId,
            role,
        });
    }
    async getProject(projectId) {
        return await this.projectRepository.findOneOrFail({
            where: {
                id: projectId,
            },
        });
    }
    async getProjectRelations(projectId) {
        return await this.projectRelationRepository.find({
            where: { projectId },
            relations: { user: true },
        });
    }
    async getUserOwnedOrAdminProjects(userId) {
        return await this.projectRepository.find({
            where: {
                projectRelations: {
                    userId,
                    role: (0, typeorm_1.In)(['project:personalOwner', 'project:admin']),
                },
            },
        });
    }
    async getProjectCounts() {
        return await this.projectRepository.getProjectCounts();
    }
};
exports.ProjectService = ProjectService;
exports.ProjectService = ProjectService = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [shared_workflow_repository_1.SharedWorkflowRepository,
        project_repository_1.ProjectRepository,
        project_relation_repository_1.ProjectRelationRepository,
        role_service_1.RoleService,
        shared_credentials_repository_1.SharedCredentialsRepository,
        cache_service_1.CacheService,
        license_1.License])
], ProjectService);
//# sourceMappingURL=project.service.js.map