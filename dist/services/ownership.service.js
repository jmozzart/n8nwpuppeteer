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
exports.OwnershipService = void 0;
const typedi_1 = require("typedi");
const project_relation_repository_1 = require("../databases/repositories/project-relation.repository");
const project_repository_1 = require("../databases/repositories/project.repository");
const shared_workflow_repository_1 = require("../databases/repositories/shared-workflow.repository");
const user_repository_1 = require("../databases/repositories/user.repository");
const cache_service_1 = require("../services/cache/cache.service");
let OwnershipService = class OwnershipService {
    constructor(cacheService, userRepository, projectRepository, projectRelationRepository, sharedWorkflowRepository) {
        this.cacheService = cacheService;
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
        this.projectRelationRepository = projectRelationRepository;
        this.sharedWorkflowRepository = sharedWorkflowRepository;
    }
    async getWorkflowProjectCached(workflowId) {
        const cachedValue = await this.cacheService.getHashValue('workflow-project', workflowId);
        if (cachedValue)
            return this.projectRepository.create(cachedValue);
        const sharedWorkflow = await this.sharedWorkflowRepository.findOneOrFail({
            where: { workflowId, role: 'workflow:owner' },
            relations: ['project'],
        });
        void this.cacheService.setHash('workflow-project', { [workflowId]: sharedWorkflow.project });
        return sharedWorkflow.project;
    }
    async getPersonalProjectOwnerCached(projectId) {
        const cachedValue = await this.cacheService.getHashValue('project-owner', projectId);
        if (cachedValue)
            return this.userRepository.create(cachedValue);
        const ownerRel = await this.projectRelationRepository.getPersonalProjectOwners([projectId]);
        const owner = ownerRel[0]?.user ?? null;
        void this.cacheService.setHash('project-owner', { [projectId]: owner });
        return owner;
    }
    addOwnedByAndSharedWith(rawEntity) {
        const shared = rawEntity.shared;
        const entity = rawEntity;
        Object.assign(entity, {
            homeProject: null,
            sharedWithProjects: [],
        });
        if (shared === undefined) {
            return entity;
        }
        for (const sharedEntity of shared) {
            const { project, role } = sharedEntity;
            if (role === 'credential:owner' || role === 'workflow:owner') {
                entity.homeProject = {
                    id: project.id,
                    type: project.type,
                    name: project.name,
                };
            }
            else {
                entity.sharedWithProjects.push({
                    id: project.id,
                    type: project.type,
                    name: project.name,
                });
            }
        }
        return entity;
    }
    async getInstanceOwner() {
        return await this.userRepository.findOneOrFail({
            where: { role: 'global:owner' },
        });
    }
};
exports.OwnershipService = OwnershipService;
exports.OwnershipService = OwnershipService = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [cache_service_1.CacheService,
        user_repository_1.UserRepository,
        project_repository_1.ProjectRepository,
        project_relation_repository_1.ProjectRelationRepository,
        shared_workflow_repository_1.SharedWorkflowRepository])
], OwnershipService);
//# sourceMappingURL=ownership.service.js.map