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
exports.CredentialsController = void 0;
const config_1 = require("@n8n/config");
const typeorm_1 = require("@n8n/typeorm");
const n8n_workflow_1 = require("n8n-workflow");
const zod_1 = require("zod");
const shared_credentials_1 = require("../databases/entities/shared-credentials");
const project_relation_repository_1 = require("../databases/repositories/project-relation.repository");
const shared_credentials_repository_1 = require("../databases/repositories/shared-credentials.repository");
const Db = __importStar(require("../db"));
const decorators_1 = require("../decorators");
const bad_request_error_1 = require("../errors/response-errors/bad-request.error");
const forbidden_error_1 = require("../errors/response-errors/forbidden.error");
const not_found_error_1 = require("../errors/response-errors/not-found.error");
const event_service_1 = require("../events/event.service");
const license_1 = require("../license");
const logger_service_1 = require("../logging/logger.service");
const middlewares_1 = require("../middlewares");
const naming_service_1 = require("../services/naming.service");
const email_1 = require("../user-management/email");
const utils = __importStar(require("../utils"));
const credentials_service_1 = require("./credentials.service");
const credentials_service_ee_1 = require("./credentials.service.ee");
let CredentialsController = class CredentialsController {
    constructor(globalConfig, credentialsService, enterpriseCredentialsService, namingService, license, logger, userManagementMailer, sharedCredentialsRepository, projectRelationRepository, eventService) {
        this.globalConfig = globalConfig;
        this.credentialsService = credentialsService;
        this.enterpriseCredentialsService = enterpriseCredentialsService;
        this.namingService = namingService;
        this.license = license;
        this.logger = logger;
        this.userManagementMailer = userManagementMailer;
        this.sharedCredentialsRepository = sharedCredentialsRepository;
        this.projectRelationRepository = projectRelationRepository;
        this.eventService = eventService;
    }
    async getMany(req) {
        const credentials = await this.credentialsService.getMany(req.user, {
            listQueryOptions: req.listQueryOptions,
            includeScopes: req.query.includeScopes,
        });
        credentials.forEach((c) => {
            delete c.shared;
        });
        return credentials;
    }
    async getProjectCredentials(req) {
        const options = zod_1.z
            .union([zod_1.z.object({ workflowId: zod_1.z.string() }), zod_1.z.object({ projectId: zod_1.z.string() })])
            .parse(req.query);
        return await this.credentialsService.getCredentialsAUserCanUseInAWorkflow(req.user, options);
    }
    async generateUniqueName(req) {
        const requestedName = req.query.name ?? this.globalConfig.credentials.defaultName;
        return {
            name: await this.namingService.getUniqueCredentialName(requestedName),
        };
    }
    async getOne(req) {
        const { shared, ...credential } = this.license.isSharingEnabled()
            ? await this.enterpriseCredentialsService.getOne(req.user, req.params.credentialId, req.query.includeData === 'true')
            : await this.credentialsService.getOne(req.user, req.params.credentialId, req.query.includeData === 'true');
        const scopes = await this.credentialsService.getCredentialScopes(req.user, req.params.credentialId);
        return { ...credential, scopes };
    }
    async testCredentials(req) {
        const { credentials } = req.body;
        const storedCredential = await this.sharedCredentialsRepository.findCredentialForUser(credentials.id, req.user, ['credential:read']);
        if (!storedCredential) {
            throw new forbidden_error_1.ForbiddenError();
        }
        const mergedCredentials = (0, n8n_workflow_1.deepCopy)(credentials);
        const decryptedData = this.credentialsService.decrypt(storedCredential);
        await this.credentialsService.replaceCredentialContentsForSharee(req.user, storedCredential, decryptedData, mergedCredentials);
        if (mergedCredentials.data && storedCredential) {
            mergedCredentials.data = this.credentialsService.unredact(mergedCredentials.data, decryptedData);
        }
        return await this.credentialsService.test(req.user, mergedCredentials);
    }
    async createCredentials(req) {
        const newCredential = await this.credentialsService.prepareCreateData(req.body);
        const encryptedData = this.credentialsService.createEncryptedData(null, newCredential);
        const { shared, ...credential } = await this.credentialsService.save(newCredential, encryptedData, req.user, req.body.projectId);
        const project = await this.sharedCredentialsRepository.findCredentialOwningProject(credential.id);
        this.eventService.emit('credentials-created', {
            user: req.user,
            credentialType: credential.type,
            credentialId: credential.id,
            publicApi: false,
            projectId: project?.id,
            projectType: project?.type,
        });
        const scopes = await this.credentialsService.getCredentialScopes(req.user, credential.id);
        return { ...credential, scopes };
    }
    async updateCredentials(req) {
        const { credentialId } = req.params;
        const credential = await this.sharedCredentialsRepository.findCredentialForUser(credentialId, req.user, ['credential:update']);
        if (!credential) {
            this.logger.info('Attempt to update credential blocked due to lack of permissions', {
                credentialId,
                userId: req.user.id,
            });
            throw new not_found_error_1.NotFoundError('Credential to be updated not found. You can only update credentials owned by you');
        }
        const decryptedData = this.credentialsService.decrypt(credential);
        const preparedCredentialData = await this.credentialsService.prepareUpdateData(req.body, decryptedData);
        const newCredentialData = this.credentialsService.createEncryptedData(credentialId, preparedCredentialData);
        const responseData = await this.credentialsService.update(credentialId, newCredentialData);
        if (responseData === null) {
            throw new not_found_error_1.NotFoundError(`Credential ID "${credentialId}" could not be found to be updated.`);
        }
        const { data, shared, ...rest } = responseData;
        this.logger.debug('Credential updated', { credentialId });
        this.eventService.emit('credentials-updated', {
            user: req.user,
            credentialType: credential.type,
            credentialId: credential.id,
        });
        const scopes = await this.credentialsService.getCredentialScopes(req.user, credential.id);
        return { ...rest, scopes };
    }
    async deleteCredentials(req) {
        const { credentialId } = req.params;
        const credential = await this.sharedCredentialsRepository.findCredentialForUser(credentialId, req.user, ['credential:delete']);
        if (!credential) {
            this.logger.info('Attempt to delete credential blocked due to lack of permissions', {
                credentialId,
                userId: req.user.id,
            });
            throw new not_found_error_1.NotFoundError('Credential to be deleted not found. You can only removed credentials owned by you');
        }
        await this.credentialsService.delete(credential);
        this.eventService.emit('credentials-deleted', {
            user: req.user,
            credentialType: credential.type,
            credentialId: credential.id,
        });
        return true;
    }
    async shareCredentials(req) {
        const { credentialId } = req.params;
        const { shareWithIds } = req.body;
        if (!Array.isArray(shareWithIds) ||
            !shareWithIds.every((userId) => typeof userId === 'string')) {
            throw new bad_request_error_1.BadRequestError('Bad request');
        }
        const credential = await this.sharedCredentialsRepository.findCredentialForUser(credentialId, req.user, ['credential:share']);
        if (!credential) {
            throw new forbidden_error_1.ForbiddenError();
        }
        let amountRemoved = null;
        let newShareeIds = [];
        await Db.transaction(async (trx) => {
            const currentProjectIds = credential.shared
                .filter((sc) => sc.role === 'credential:user')
                .map((sc) => sc.projectId);
            const newProjectIds = shareWithIds;
            const toShare = utils.rightDiff([currentProjectIds, (id) => id], [newProjectIds, (id) => id]);
            const toUnshare = utils.rightDiff([newProjectIds, (id) => id], [currentProjectIds, (id) => id]);
            const deleteResult = await trx.delete(shared_credentials_1.SharedCredentials, {
                credentialsId: credentialId,
                projectId: (0, typeorm_1.In)(toUnshare),
            });
            await this.enterpriseCredentialsService.shareWithProjects(req.user, credential, toShare, trx);
            if (deleteResult.affected) {
                amountRemoved = deleteResult.affected;
            }
            newShareeIds = toShare;
        });
        this.eventService.emit('credentials-shared', {
            user: req.user,
            credentialType: credential.type,
            credentialId: credential.id,
            userIdSharer: req.user.id,
            userIdsShareesAdded: newShareeIds,
            shareesRemoved: amountRemoved,
        });
        const projectsRelations = await this.projectRelationRepository.findBy({
            projectId: (0, typeorm_1.In)(newShareeIds),
            role: 'project:personalOwner',
        });
        await this.userManagementMailer.notifyCredentialsShared({
            sharer: req.user,
            newShareeIds: projectsRelations.map((pr) => pr.userId),
            credentialsName: credential.name,
        });
    }
    async transfer(req) {
        const body = zod_1.z.object({ destinationProjectId: zod_1.z.string() }).parse(req.body);
        return await this.enterpriseCredentialsService.transferOne(req.user, req.params.credentialId, body.destinationProjectId);
    }
};
exports.CredentialsController = CredentialsController;
__decorate([
    (0, decorators_1.Get)('/', { middlewares: middlewares_1.listQueryMiddleware }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CredentialsController.prototype, "getMany", null);
__decorate([
    (0, decorators_1.Get)('/for-workflow'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CredentialsController.prototype, "getProjectCredentials", null);
__decorate([
    (0, decorators_1.Get)('/new'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CredentialsController.prototype, "generateUniqueName", null);
__decorate([
    (0, decorators_1.Get)('/:credentialId'),
    (0, decorators_1.ProjectScope)('credential:read'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CredentialsController.prototype, "getOne", null);
__decorate([
    (0, decorators_1.Post)('/test'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CredentialsController.prototype, "testCredentials", null);
__decorate([
    (0, decorators_1.Post)('/'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CredentialsController.prototype, "createCredentials", null);
__decorate([
    (0, decorators_1.Patch)('/:credentialId'),
    (0, decorators_1.ProjectScope)('credential:update'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CredentialsController.prototype, "updateCredentials", null);
__decorate([
    (0, decorators_1.Delete)('/:credentialId'),
    (0, decorators_1.ProjectScope)('credential:delete'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CredentialsController.prototype, "deleteCredentials", null);
__decorate([
    (0, decorators_1.Licensed)('feat:sharing'),
    (0, decorators_1.Put)('/:credentialId/share'),
    (0, decorators_1.ProjectScope)('credential:share'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CredentialsController.prototype, "shareCredentials", null);
__decorate([
    (0, decorators_1.Put)('/:credentialId/transfer'),
    (0, decorators_1.ProjectScope)('credential:move'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CredentialsController.prototype, "transfer", null);
exports.CredentialsController = CredentialsController = __decorate([
    (0, decorators_1.RestController)('/credentials'),
    __metadata("design:paramtypes", [config_1.GlobalConfig,
        credentials_service_1.CredentialsService,
        credentials_service_ee_1.EnterpriseCredentialsService,
        naming_service_1.NamingService,
        license_1.License,
        logger_service_1.Logger,
        email_1.UserManagementMailer,
        shared_credentials_repository_1.SharedCredentialsRepository,
        project_relation_repository_1.ProjectRelationRepository,
        event_service_1.EventService])
], CredentialsController);
//# sourceMappingURL=credentials.controller.js.map