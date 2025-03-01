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
exports.CredentialsService = void 0;
const typeorm_1 = require("@n8n/typeorm");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const typedi_1 = require("typedi");
const constants_1 = require("../constants");
const credential_types_1 = require("../credential-types");
const credentials_helper_1 = require("../credentials-helper");
const credentials_entity_1 = require("../databases/entities/credentials-entity");
const shared_credentials_1 = require("../databases/entities/shared-credentials");
const credentials_repository_1 = require("../databases/repositories/credentials.repository");
const project_repository_1 = require("../databases/repositories/project.repository");
const shared_credentials_repository_1 = require("../databases/repositories/shared-credentials.repository");
const user_repository_1 = require("../databases/repositories/user.repository");
const Db = __importStar(require("../db"));
const bad_request_error_1 = require("../errors/response-errors/bad-request.error");
const not_found_error_1 = require("../errors/response-errors/not-found.error");
const external_hooks_1 = require("../external-hooks");
const generic_helpers_1 = require("../generic-helpers");
const logger_service_1 = require("../logging/logger.service");
const check_access_1 = require("../permissions/check-access");
const credentials_tester_service_1 = require("../services/credentials-tester.service");
const ownership_service_1 = require("../services/ownership.service");
const project_service_1 = require("../services/project.service");
const role_service_1 = require("../services/role.service");
let CredentialsService = class CredentialsService {
    constructor(credentialsRepository, sharedCredentialsRepository, ownershipService, logger, credentialsTester, externalHooks, credentialTypes, projectRepository, projectService, roleService, userRepository) {
        this.credentialsRepository = credentialsRepository;
        this.sharedCredentialsRepository = sharedCredentialsRepository;
        this.ownershipService = ownershipService;
        this.logger = logger;
        this.credentialsTester = credentialsTester;
        this.externalHooks = externalHooks;
        this.credentialTypes = credentialTypes;
        this.projectRepository = projectRepository;
        this.projectService = projectService;
        this.roleService = roleService;
        this.userRepository = userRepository;
    }
    async getMany(user, options = {}) {
        const returnAll = user.hasGlobalScope('credential:list');
        const isDefaultSelect = !options.listQueryOptions?.select;
        let projectRelations = undefined;
        if (options.includeScopes) {
            projectRelations = await this.projectService.getProjectRelationsForUser(user);
            if (options.listQueryOptions?.filter?.projectId && user.hasGlobalScope('credential:list')) {
                const projectRelation = projectRelations.find((relation) => relation.projectId === options.listQueryOptions?.filter?.projectId);
                if (projectRelation?.role === 'project:personalOwner') {
                    delete options.listQueryOptions?.filter?.projectId;
                }
            }
        }
        if (returnAll) {
            let credentials = await this.credentialsRepository.findMany(options.listQueryOptions);
            if (isDefaultSelect) {
                if (options.listQueryOptions?.filter?.shared?.projectId) {
                    const relations = await this.sharedCredentialsRepository.getAllRelationsForCredentials(credentials.map((c) => c.id));
                    credentials.forEach((c) => {
                        c.shared = relations.filter((r) => r.credentialsId === c.id);
                    });
                }
                credentials = credentials.map((c) => this.ownershipService.addOwnedByAndSharedWith(c));
            }
            if (options.includeScopes) {
                credentials = credentials.map((c) => this.roleService.addScopes(c, user, projectRelations));
            }
            return credentials;
        }
        if (typeof options.listQueryOptions?.filter?.projectId === 'string') {
            const project = await this.projectService.getProject(options.listQueryOptions.filter.projectId);
            if (project?.type === 'personal') {
                const currentUsersPersonalProject = await this.projectService.getPersonalProject(user);
                options.listQueryOptions.filter.projectId = currentUsersPersonalProject?.id;
            }
        }
        const ids = await this.sharedCredentialsRepository.getCredentialIdsByUserAndRole([user.id], {
            scopes: ['credential:read'],
        });
        let credentials = await this.credentialsRepository.findMany(options.listQueryOptions, ids);
        if (isDefaultSelect) {
            if (options.listQueryOptions?.filter?.shared?.projectId) {
                const relations = await this.sharedCredentialsRepository.getAllRelationsForCredentials(credentials.map((c) => c.id));
                credentials.forEach((c) => {
                    c.shared = relations.filter((r) => r.credentialsId === c.id);
                });
            }
            credentials = credentials.map((c) => this.ownershipService.addOwnedByAndSharedWith(c));
        }
        if (options.includeScopes) {
            credentials = credentials.map((c) => this.roleService.addScopes(c, user, projectRelations));
        }
        return credentials;
    }
    async getCredentialsAUserCanUseInAWorkflow(user, options) {
        const projectRelations = await this.projectService.getProjectRelationsForUser(user);
        const allCredentials = await this.credentialsRepository.findCredentialsForUser(user, [
            'credential:read',
        ]);
        const allCredentialsForWorkflow = 'workflowId' in options
            ? (await this.findAllCredentialIdsForWorkflow(options.workflowId)).map((c) => c.id)
            : (await this.findAllCredentialIdsForProject(options.projectId)).map((c) => c.id);
        const intersection = allCredentials.filter((c) => allCredentialsForWorkflow.includes(c.id));
        return intersection
            .map((c) => this.roleService.addScopes(c, user, projectRelations))
            .map((c) => ({
            id: c.id,
            name: c.name,
            type: c.type,
            scopes: c.scopes,
        }));
    }
    async findAllCredentialIdsForWorkflow(workflowId) {
        const user = await this.userRepository.findPersonalOwnerForWorkflow(workflowId);
        if (user?.hasGlobalScope('credential:read')) {
            return await this.credentialsRepository.findAllPersonalCredentials();
        }
        return await this.credentialsRepository.findAllCredentialsForWorkflow(workflowId);
    }
    async findAllCredentialIdsForProject(projectId) {
        const user = await this.userRepository.findPersonalOwnerForProject(projectId);
        if (user?.hasGlobalScope('credential:read')) {
            return await this.credentialsRepository.findAllPersonalCredentials();
        }
        return await this.credentialsRepository.findAllCredentialsForProject(projectId);
    }
    async getSharing(user, credentialId, globalScopes, relations = { credentials: true }) {
        let where = { credentialsId: credentialId };
        if (!user.hasGlobalScope(globalScopes, { mode: 'allOf' })) {
            where = {
                ...where,
                role: 'credential:owner',
                project: {
                    projectRelations: {
                        role: 'project:personalOwner',
                        userId: user.id,
                    },
                },
            };
        }
        return await this.sharedCredentialsRepository.findOne({
            where,
            relations,
        });
    }
    async prepareCreateData(data) {
        const { id, ...rest } = data;
        const newCredentials = this.credentialsRepository.create(rest);
        await (0, generic_helpers_1.validateEntity)(newCredentials);
        return newCredentials;
    }
    async prepareUpdateData(data, decryptedData) {
        const mergedData = (0, n8n_workflow_1.deepCopy)(data);
        if (mergedData.data) {
            mergedData.data = this.unredact(mergedData.data, decryptedData);
        }
        const updateData = this.credentialsRepository.create(mergedData);
        await (0, generic_helpers_1.validateEntity)(updateData);
        if (decryptedData.oauthTokenData) {
            updateData.data.oauthTokenData = decryptedData.oauthTokenData;
        }
        return updateData;
    }
    createEncryptedData(credentialId, data) {
        const credentials = new n8n_core_1.Credentials({ id: credentialId, name: data.name }, data.type);
        credentials.setData(data.data);
        const newCredentialData = credentials.getDataToSave();
        newCredentialData.updatedAt = new Date();
        return newCredentialData;
    }
    decrypt(credential) {
        const coreCredential = (0, credentials_helper_1.createCredentialsFromCredentialsEntity)(credential);
        return coreCredential.getData();
    }
    async update(credentialId, newCredentialData) {
        await this.externalHooks.run('credentials.update', [newCredentialData]);
        await this.credentialsRepository.update(credentialId, newCredentialData);
        return await this.credentialsRepository.findOneBy({ id: credentialId });
    }
    async save(credential, encryptedData, user, projectId) {
        const newCredential = new credentials_entity_1.CredentialsEntity();
        Object.assign(newCredential, credential, encryptedData);
        await this.externalHooks.run('credentials.create', [encryptedData]);
        const result = await Db.transaction(async (transactionManager) => {
            const savedCredential = await transactionManager.save(newCredential);
            savedCredential.data = newCredential.data;
            const project = projectId === undefined
                ? await this.projectRepository.getPersonalProjectForUserOrFail(user.id, transactionManager)
                : await this.projectService.getProjectWithScope(user, projectId, ['credential:create'], transactionManager);
            if (typeof projectId === 'string' && project === null) {
                throw new bad_request_error_1.BadRequestError("You don't have the permissions to save the credential in this project.");
            }
            if (project === null) {
                throw new n8n_workflow_1.ApplicationError('No personal project found');
            }
            const newSharedCredential = this.sharedCredentialsRepository.create({
                role: 'credential:owner',
                credentials: savedCredential,
                projectId: project.id,
            });
            await transactionManager.save(newSharedCredential);
            return savedCredential;
        });
        this.logger.debug('New credential created', {
            credentialId: newCredential.id,
            ownerId: user.id,
        });
        return result;
    }
    async delete(credentials) {
        await this.externalHooks.run('credentials.delete', [credentials.id]);
        await this.credentialsRepository.remove(credentials);
    }
    async test(user, credentials) {
        return await this.credentialsTester.testCredentials(user, credentials.type, credentials);
    }
    redact(data, credential) {
        const copiedData = (0, n8n_workflow_1.deepCopy)(data);
        let credType;
        try {
            credType = this.credentialTypes.getByName(credential.type);
        }
        catch {
            return data;
        }
        const getExtendedProps = (type) => {
            const props = [];
            for (const e of type.extends ?? []) {
                const extendsType = this.credentialTypes.getByName(e);
                const extendedProps = getExtendedProps(extendsType);
                n8n_workflow_1.NodeHelpers.mergeNodeProperties(props, extendedProps);
            }
            n8n_workflow_1.NodeHelpers.mergeNodeProperties(props, type.properties);
            return props;
        };
        const properties = getExtendedProps(credType);
        for (const dataKey of Object.keys(copiedData)) {
            if (dataKey === 'oauthTokenData' || dataKey === 'csrfSecret') {
                if (copiedData[dataKey].toString().length > 0) {
                    copiedData[dataKey] = constants_1.CREDENTIAL_BLANKING_VALUE;
                }
                else {
                    copiedData[dataKey] = n8n_workflow_1.CREDENTIAL_EMPTY_VALUE;
                }
                continue;
            }
            const prop = properties.find((v) => v.name === dataKey);
            if (!prop) {
                continue;
            }
            if (prop.typeOptions?.password &&
                (!copiedData[dataKey].startsWith('={{') || prop.noDataExpression)) {
                if (copiedData[dataKey].toString().length > 0) {
                    copiedData[dataKey] = constants_1.CREDENTIAL_BLANKING_VALUE;
                }
                else {
                    copiedData[dataKey] = n8n_workflow_1.CREDENTIAL_EMPTY_VALUE;
                }
            }
        }
        return copiedData;
    }
    unredactRestoreValues(unmerged, replacement) {
        for (const [key, value] of Object.entries(unmerged)) {
            if (value === constants_1.CREDENTIAL_BLANKING_VALUE || value === n8n_workflow_1.CREDENTIAL_EMPTY_VALUE) {
                unmerged[key] = replacement[key];
            }
            else if (typeof value === 'object' &&
                value !== null &&
                key in replacement &&
                typeof replacement[key] === 'object' &&
                replacement[key] !== null) {
                this.unredactRestoreValues(value, replacement[key]);
            }
        }
    }
    unredact(redactedData, savedData) {
        const mergedData = (0, n8n_workflow_1.deepCopy)(redactedData);
        this.unredactRestoreValues(mergedData, savedData);
        return mergedData;
    }
    async getOne(user, credentialId, includeDecryptedData) {
        let sharing = null;
        let decryptedData = null;
        sharing = includeDecryptedData
            ?
                await this.getSharing(user, credentialId, [
                    'credential:read',
                ])
            : null;
        if (sharing) {
            decryptedData = this.redact(this.decrypt(sharing.credentials), sharing.credentials);
        }
        else {
            sharing = await this.getSharing(user, credentialId, ['credential:read']);
        }
        if (!sharing) {
            throw new not_found_error_1.NotFoundError(`Credential with ID "${credentialId}" could not be found.`);
        }
        const { credentials: credential } = sharing;
        const { data: _, ...rest } = credential;
        if (decryptedData) {
            return { data: decryptedData, ...rest };
        }
        return { ...rest };
    }
    async getCredentialScopes(user, credentialId) {
        const userProjectRelations = await this.projectService.getProjectRelationsForUser(user);
        const shared = await this.sharedCredentialsRepository.find({
            where: {
                projectId: (0, typeorm_1.In)([...new Set(userProjectRelations.map((pr) => pr.projectId))]),
                credentialsId: credentialId,
            },
        });
        return this.roleService.combineResourceScopes('credential', user, shared, userProjectRelations);
    }
    async transferAll(fromProjectId, toProjectId, trx) {
        trx = trx ?? this.credentialsRepository.manager;
        const allSharedCredentials = await trx.findBy(shared_credentials_1.SharedCredentials, {
            projectId: (0, typeorm_1.In)([fromProjectId, toProjectId]),
        });
        const sharedCredentialsOfFromProject = allSharedCredentials.filter((sc) => sc.projectId === fromProjectId);
        const ownedCredentialIds = sharedCredentialsOfFromProject
            .filter((sc) => sc.role === 'credential:owner')
            .map((sc) => sc.credentialsId);
        await this.sharedCredentialsRepository.makeOwner(ownedCredentialIds, toProjectId, trx);
        await this.sharedCredentialsRepository.deleteByIds(ownedCredentialIds, fromProjectId, trx);
        const sharedCredentialIdsOfTransferee = allSharedCredentials
            .filter((sc) => sc.projectId === toProjectId)
            .map((sc) => sc.credentialsId);
        const sharedCredentialsToTransfer = sharedCredentialsOfFromProject.filter((sc) => sc.role !== 'credential:owner' &&
            !sharedCredentialIdsOfTransferee.includes(sc.credentialsId));
        await trx.insert(shared_credentials_1.SharedCredentials, sharedCredentialsToTransfer.map((sc) => ({
            credentialsId: sc.credentialsId,
            projectId: toProjectId,
            role: sc.role,
        })));
    }
    async replaceCredentialContentsForSharee(user, credential, decryptedData, mergedCredentials) {
        if (!(await (0, check_access_1.userHasScopes)(user, ['credential:update'], false, { credentialId: credential.id }))) {
            mergedCredentials.data = decryptedData;
        }
    }
};
exports.CredentialsService = CredentialsService;
exports.CredentialsService = CredentialsService = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [credentials_repository_1.CredentialsRepository,
        shared_credentials_repository_1.SharedCredentialsRepository,
        ownership_service_1.OwnershipService,
        logger_service_1.Logger,
        credentials_tester_service_1.CredentialsTester,
        external_hooks_1.ExternalHooks,
        credential_types_1.CredentialTypes,
        project_repository_1.ProjectRepository,
        project_service_1.ProjectService,
        role_service_1.RoleService,
        user_repository_1.UserRepository])
], CredentialsService);
//# sourceMappingURL=credentials.service.js.map