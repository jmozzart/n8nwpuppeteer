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
exports.CredentialsRepository = void 0;
const typeorm_1 = require("@n8n/typeorm");
const typedi_1 = require("typedi");
const role_service_1 = require("../../services/role.service");
const credentials_entity_1 = require("../entities/credentials-entity");
let CredentialsRepository = class CredentialsRepository extends typeorm_1.Repository {
    constructor(dataSource, roleService) {
        super(credentials_entity_1.CredentialsEntity, dataSource.manager);
        this.roleService = roleService;
    }
    async findStartingWith(credentialName) {
        return await this.find({
            select: ['name'],
            where: { name: (0, typeorm_1.Like)(`${credentialName}%`) },
        });
    }
    async findMany(listQueryOptions, credentialIds) {
        const findManyOptions = this.toFindManyOptions(listQueryOptions);
        if (credentialIds) {
            findManyOptions.where = { ...findManyOptions.where, id: (0, typeorm_1.In)(credentialIds) };
        }
        return await this.find(findManyOptions);
    }
    toFindManyOptions(listQueryOptions) {
        const findManyOptions = {};
        const defaultRelations = ['shared', 'shared.project'];
        const defaultSelect = ['id', 'name', 'type', 'createdAt', 'updatedAt'];
        if (!listQueryOptions)
            return { select: defaultSelect, relations: defaultRelations };
        const { filter, select, take, skip } = listQueryOptions;
        if (typeof filter?.name === 'string' && filter?.name !== '') {
            filter.name = (0, typeorm_1.Like)(`%${filter.name}%`);
        }
        if (typeof filter?.type === 'string' && filter?.type !== '') {
            filter.type = (0, typeorm_1.Like)(`%${filter.type}%`);
        }
        if (typeof filter?.projectId === 'string' && filter.projectId !== '') {
            filter.shared = { projectId: filter.projectId };
            delete filter.projectId;
        }
        if (filter)
            findManyOptions.where = filter;
        if (select)
            findManyOptions.select = select;
        if (take)
            findManyOptions.take = take;
        if (skip)
            findManyOptions.skip = skip;
        if (take && select && !select?.id) {
            findManyOptions.select = { ...findManyOptions.select, id: true };
        }
        if (!findManyOptions.select) {
            findManyOptions.select = defaultSelect;
            findManyOptions.relations = defaultRelations;
        }
        return findManyOptions;
    }
    async getManyByIds(ids, { withSharings } = { withSharings: false }) {
        const findManyOptions = { where: { id: (0, typeorm_1.In)(ids) } };
        if (withSharings) {
            findManyOptions.relations = {
                shared: {
                    project: true,
                },
            };
        }
        return await this.find(findManyOptions);
    }
    async findAllPersonalCredentials() {
        return await this.findBy({ shared: { project: { type: 'personal' } } });
    }
    async findAllCredentialsForWorkflow(workflowId) {
        return await this.findBy({
            shared: { project: { sharedWorkflows: { workflowId } } },
        });
    }
    async findAllCredentialsForProject(projectId) {
        return await this.findBy({ shared: { projectId } });
    }
    async findCredentialsForUser(user, scopes) {
        let where = {};
        if (!user.hasGlobalScope(scopes, { mode: 'allOf' })) {
            const projectRoles = this.roleService.rolesWithScope('project', scopes);
            const credentialRoles = this.roleService.rolesWithScope('credential', scopes);
            where = {
                ...where,
                shared: {
                    role: (0, typeorm_1.In)(credentialRoles),
                    project: {
                        projectRelations: {
                            role: (0, typeorm_1.In)(projectRoles),
                            userId: user.id,
                        },
                    },
                },
            };
        }
        return await this.find({ where, relations: { shared: true } });
    }
};
exports.CredentialsRepository = CredentialsRepository;
exports.CredentialsRepository = CredentialsRepository = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource,
        role_service_1.RoleService])
], CredentialsRepository);
//# sourceMappingURL=credentials.repository.js.map