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
exports.SharedCredentialsRepository = void 0;
const typeorm_1 = require("@n8n/typeorm");
const typedi_1 = require("typedi");
const role_service_1 = require("../../services/role.service");
const shared_credentials_1 = require("../entities/shared-credentials");
let SharedCredentialsRepository = class SharedCredentialsRepository extends typeorm_1.Repository {
    constructor(dataSource, roleService) {
        super(shared_credentials_1.SharedCredentials, dataSource.manager);
        this.roleService = roleService;
    }
    async findCredentialForUser(credentialsId, user, scopes, _relations) {
        let where = { credentialsId };
        if (!user.hasGlobalScope(scopes, { mode: 'allOf' })) {
            const projectRoles = this.roleService.rolesWithScope('project', scopes);
            const credentialRoles = this.roleService.rolesWithScope('credential', scopes);
            where = {
                ...where,
                role: (0, typeorm_1.In)(credentialRoles),
                project: {
                    projectRelations: {
                        role: (0, typeorm_1.In)(projectRoles),
                        userId: user.id,
                    },
                },
            };
        }
        const sharedCredential = await this.findOne({
            where,
            relations: {
                credentials: {
                    shared: { project: { projectRelations: { user: true } } },
                },
            },
        });
        if (!sharedCredential)
            return null;
        return sharedCredential.credentials;
    }
    async findByCredentialIds(credentialIds, role) {
        return await this.find({
            relations: { credentials: true, project: { projectRelations: { user: true } } },
            where: {
                credentialsId: (0, typeorm_1.In)(credentialIds),
                role,
            },
        });
    }
    async makeOwnerOfAllCredentials(project) {
        return await this.update({
            projectId: (0, typeorm_1.Not)(project.id),
            role: 'credential:owner',
        }, { project });
    }
    async makeOwner(credentialIds, projectId, trx) {
        trx = trx ?? this.manager;
        return await trx.upsert(shared_credentials_1.SharedCredentials, credentialIds.map((credentialsId) => ({
            projectId,
            credentialsId,
            role: 'credential:owner',
        })), ['projectId', 'credentialsId']);
    }
    async getCredentialIdsByUserAndRole(userIds, options) {
        const projectRoles = 'scopes' in options
            ? this.roleService.rolesWithScope('project', options.scopes)
            : options.projectRoles;
        const credentialRoles = 'scopes' in options
            ? this.roleService.rolesWithScope('credential', options.scopes)
            : options.credentialRoles;
        const sharings = await this.find({
            where: {
                role: (0, typeorm_1.In)(credentialRoles),
                project: {
                    projectRelations: {
                        userId: (0, typeorm_1.In)(userIds),
                        role: (0, typeorm_1.In)(projectRoles),
                    },
                },
            },
        });
        return sharings.map((s) => s.credentialsId);
    }
    async deleteByIds(sharedCredentialsIds, projectId, trx) {
        trx = trx ?? this.manager;
        return await trx.delete(shared_credentials_1.SharedCredentials, {
            projectId,
            credentialsId: (0, typeorm_1.In)(sharedCredentialsIds),
        });
    }
    async getFilteredAccessibleCredentials(projectIds, credentialsIds) {
        return (await this.find({
            where: {
                projectId: (0, typeorm_1.In)(projectIds),
                credentialsId: (0, typeorm_1.In)(credentialsIds),
            },
            select: ['credentialsId'],
        })).map((s) => s.credentialsId);
    }
    async findCredentialOwningProject(credentialsId) {
        return (await this.findOne({
            where: { credentialsId, role: 'credential:owner' },
            relations: { project: true },
        }))?.project;
    }
    async getAllRelationsForCredentials(credentialIds) {
        return await this.find({
            where: {
                credentialsId: (0, typeorm_1.In)(credentialIds),
            },
            relations: ['project'],
        });
    }
};
exports.SharedCredentialsRepository = SharedCredentialsRepository;
exports.SharedCredentialsRepository = SharedCredentialsRepository = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource,
        role_service_1.RoleService])
], SharedCredentialsRepository);
//# sourceMappingURL=shared-credentials.repository.js.map