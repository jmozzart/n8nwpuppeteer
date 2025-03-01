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
exports.ProjectController = void 0;
const permissions_1 = require("@n8n/permissions");
const typeorm_1 = require("@n8n/typeorm");
const project_repository_1 = require("../databases/repositories/project.repository");
const decorators_1 = require("../decorators");
const bad_request_error_1 = require("../errors/response-errors/bad-request.error");
const not_found_error_1 = require("../errors/response-errors/not-found.error");
const event_service_1 = require("../events/event.service");
const project_service_1 = require("../services/project.service");
const role_service_1 = require("../services/role.service");
let ProjectController = class ProjectController {
    constructor(projectsService, roleService, projectRepository, eventService) {
        this.projectsService = projectsService;
        this.roleService = roleService;
        this.projectRepository = projectRepository;
        this.eventService = eventService;
    }
    async getAllProjects(req) {
        return await this.projectsService.getAccessibleProjects(req.user);
    }
    async getProjectCounts() {
        return await this.projectsService.getProjectCounts();
    }
    async createProject(req) {
        try {
            const project = await this.projectsService.createTeamProject(req.body.name, req.user);
            this.eventService.emit('team-project-created', {
                userId: req.user.id,
                role: req.user.role,
            });
            return {
                ...project,
                role: 'project:admin',
                scopes: [
                    ...(0, permissions_1.combineScopes)({
                        global: this.roleService.getRoleScopes(req.user.role),
                        project: this.roleService.getRoleScopes('project:admin'),
                    }),
                ],
            };
        }
        catch (e) {
            if (e instanceof project_service_1.TeamProjectOverQuotaError) {
                throw new bad_request_error_1.BadRequestError(e.message);
            }
            throw e;
        }
    }
    async getMyProjects(req) {
        const relations = await this.projectsService.getProjectRelationsForUser(req.user);
        const otherTeamProject = req.user.hasGlobalScope('project:read')
            ? await this.projectRepository.findBy({
                type: 'team',
                id: (0, typeorm_1.Not)((0, typeorm_1.In)(relations.map((pr) => pr.projectId))),
            })
            : [];
        const results = [];
        for (const pr of relations) {
            const result = Object.assign(this.projectRepository.create(pr.project), {
                role: pr.role,
                scopes: req.query.includeScopes ? [] : undefined,
            });
            if (result.scopes) {
                result.scopes.push(...(0, permissions_1.combineScopes)({
                    global: this.roleService.getRoleScopes(req.user.role),
                    project: this.roleService.getRoleScopes(pr.role),
                }));
            }
            results.push(result);
        }
        for (const project of otherTeamProject) {
            const result = Object.assign(this.projectRepository.create(project), {
                role: req.user.role,
                scopes: req.query.includeScopes ? [] : undefined,
            });
            if (result.scopes) {
                result.scopes.push(...(0, permissions_1.combineScopes)({ global: this.roleService.getRoleScopes(req.user.role) }));
            }
            results.push(result);
        }
        for (const result of results) {
            if (result.scopes) {
                result.scopes = [...new Set(result.scopes)].sort();
            }
        }
        return results;
    }
    async getPersonalProject(req) {
        const project = await this.projectsService.getPersonalProject(req.user);
        if (!project) {
            throw new not_found_error_1.NotFoundError('Could not find a personal project for this user');
        }
        const scopes = [
            ...(0, permissions_1.combineScopes)({
                global: this.roleService.getRoleScopes(req.user.role),
                project: this.roleService.getRoleScopes('project:personalOwner'),
            }),
        ];
        return {
            ...project,
            scopes,
        };
    }
    async getProject(req) {
        const [{ id, name, type }, relations] = await Promise.all([
            this.projectsService.getProject(req.params.projectId),
            this.projectsService.getProjectRelations(req.params.projectId),
        ]);
        const myRelation = relations.find((r) => r.userId === req.user.id);
        return {
            id,
            name,
            type,
            relations: relations.map((r) => ({
                id: r.user.id,
                email: r.user.email,
                firstName: r.user.firstName,
                lastName: r.user.lastName,
                role: r.role,
            })),
            scopes: [
                ...(0, permissions_1.combineScopes)({
                    global: this.roleService.getRoleScopes(req.user.role),
                    ...(myRelation ? { project: this.roleService.getRoleScopes(myRelation.role) } : {}),
                }),
            ],
        };
    }
    async updateProject(req) {
        if (req.body.name) {
            await this.projectsService.updateProject(req.body.name, req.params.projectId);
        }
        if (req.body.relations) {
            try {
                await this.projectsService.syncProjectRelations(req.params.projectId, req.body.relations);
            }
            catch (e) {
                if (e instanceof project_service_1.UnlicensedProjectRoleError) {
                    throw new bad_request_error_1.BadRequestError(e.message);
                }
                throw e;
            }
            this.eventService.emit('team-project-updated', {
                userId: req.user.id,
                role: req.user.role,
                members: req.body.relations,
                projectId: req.params.projectId,
            });
        }
    }
    async deleteProject(req) {
        await this.projectsService.deleteProject(req.user, req.params.projectId, {
            migrateToProject: req.query.transferId,
        });
        this.eventService.emit('team-project-deleted', {
            userId: req.user.id,
            role: req.user.role,
            projectId: req.params.projectId,
            removalType: req.query.transferId !== undefined ? 'transfer' : 'delete',
            targetProjectId: req.query.transferId,
        });
    }
};
exports.ProjectController = ProjectController;
__decorate([
    (0, decorators_1.Get)('/'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProjectController.prototype, "getAllProjects", null);
__decorate([
    (0, decorators_1.Get)('/count'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ProjectController.prototype, "getProjectCounts", null);
__decorate([
    (0, decorators_1.Post)('/'),
    (0, decorators_1.GlobalScope)('project:create'),
    (0, decorators_1.Licensed)('feat:projectRole:admin'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProjectController.prototype, "createProject", null);
__decorate([
    (0, decorators_1.Get)('/my-projects'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProjectController.prototype, "getMyProjects", null);
__decorate([
    (0, decorators_1.Get)('/personal'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProjectController.prototype, "getPersonalProject", null);
__decorate([
    (0, decorators_1.Get)('/:projectId'),
    (0, decorators_1.ProjectScope)('project:read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProjectController.prototype, "getProject", null);
__decorate([
    (0, decorators_1.Patch)('/:projectId'),
    (0, decorators_1.ProjectScope)('project:update'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProjectController.prototype, "updateProject", null);
__decorate([
    (0, decorators_1.Delete)('/:projectId'),
    (0, decorators_1.ProjectScope)('project:delete'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ProjectController.prototype, "deleteProject", null);
exports.ProjectController = ProjectController = __decorate([
    (0, decorators_1.RestController)('/projects'),
    __metadata("design:paramtypes", [project_service_1.ProjectService,
        role_service_1.RoleService,
        project_repository_1.ProjectRepository,
        event_service_1.EventService])
], ProjectController);
//# sourceMappingURL=project.controller.js.map