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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SourceControlImportService = void 0;
const typeorm_1 = require("@n8n/typeorm");
const fast_glob_1 = __importDefault(require("fast-glob"));
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const promises_1 = require("node:fs/promises");
const path_1 = __importDefault(require("path"));
const typedi_1 = require("typedi");
const active_workflow_manager_1 = require("../../active-workflow-manager");
const shared_credentials_1 = require("../../databases/entities/shared-credentials");
const credentials_repository_1 = require("../../databases/repositories/credentials.repository");
const project_repository_1 = require("../../databases/repositories/project.repository");
const shared_credentials_repository_1 = require("../../databases/repositories/shared-credentials.repository");
const shared_workflow_repository_1 = require("../../databases/repositories/shared-workflow.repository");
const tag_repository_1 = require("../../databases/repositories/tag.repository");
const user_repository_1 = require("../../databases/repositories/user.repository");
const variables_repository_1 = require("../../databases/repositories/variables.repository");
const workflow_tag_mapping_repository_1 = require("../../databases/repositories/workflow-tag-mapping.repository");
const workflow_repository_1 = require("../../databases/repositories/workflow.repository");
const logger_service_1 = require("../../logging/logger.service");
const response_helper_1 = require("../../response-helper");
const utils_1 = require("../../utils");
const constants_1 = require("./constants");
const source_control_helper_ee_1 = require("./source-control-helper.ee");
const variables_service_ee_1 = require("../variables/variables.service.ee");
let SourceControlImportService = class SourceControlImportService {
    constructor(logger, variablesService, activeWorkflowManager, tagRepository, instanceSettings) {
        this.logger = logger;
        this.variablesService = variablesService;
        this.activeWorkflowManager = activeWorkflowManager;
        this.tagRepository = tagRepository;
        this.gitFolder = path_1.default.join(instanceSettings.n8nFolder, constants_1.SOURCE_CONTROL_GIT_FOLDER);
        this.workflowExportFolder = path_1.default.join(this.gitFolder, constants_1.SOURCE_CONTROL_WORKFLOW_EXPORT_FOLDER);
        this.credentialExportFolder = path_1.default.join(this.gitFolder, constants_1.SOURCE_CONTROL_CREDENTIAL_EXPORT_FOLDER);
    }
    async getRemoteVersionIdsFromFiles() {
        const remoteWorkflowFiles = await (0, fast_glob_1.default)('*.json', {
            cwd: this.workflowExportFolder,
            absolute: true,
        });
        const remoteWorkflowFilesParsed = await Promise.all(remoteWorkflowFiles.map(async (file) => {
            this.logger.debug(`Parsing workflow file ${file}`);
            const remote = (0, n8n_workflow_1.jsonParse)(await (0, promises_1.readFile)(file, { encoding: 'utf8' }));
            if (!remote?.id) {
                return undefined;
            }
            return {
                id: remote.id,
                versionId: remote.versionId,
                name: remote.name,
                remoteId: remote.id,
                filename: (0, source_control_helper_ee_1.getWorkflowExportPath)(remote.id, this.workflowExportFolder),
            };
        }));
        return remoteWorkflowFilesParsed.filter((e) => e !== undefined);
    }
    async getLocalVersionIdsFromDb() {
        const localWorkflows = await typedi_1.Container.get(workflow_repository_1.WorkflowRepository).find({
            select: ['id', 'name', 'versionId', 'updatedAt'],
        });
        return localWorkflows.map((local) => {
            let updatedAt;
            if (local.updatedAt instanceof Date) {
                updatedAt = local.updatedAt;
            }
            else {
                n8n_workflow_1.ErrorReporterProxy.warn('updatedAt is not a Date', {
                    extra: {
                        type: typeof local.updatedAt,
                        value: local.updatedAt,
                    },
                });
                updatedAt = isNaN(Date.parse(local.updatedAt)) ? new Date() : new Date(local.updatedAt);
            }
            return {
                id: local.id,
                versionId: local.versionId,
                name: local.name,
                localId: local.id,
                filename: (0, source_control_helper_ee_1.getWorkflowExportPath)(local.id, this.workflowExportFolder),
                updatedAt: updatedAt.toISOString(),
            };
        });
    }
    async getRemoteCredentialsFromFiles() {
        const remoteCredentialFiles = await (0, fast_glob_1.default)('*.json', {
            cwd: this.credentialExportFolder,
            absolute: true,
        });
        const remoteCredentialFilesParsed = await Promise.all(remoteCredentialFiles.map(async (file) => {
            this.logger.debug(`Parsing credential file ${file}`);
            const remote = (0, n8n_workflow_1.jsonParse)(await (0, promises_1.readFile)(file, { encoding: 'utf8' }));
            if (!remote?.id) {
                return undefined;
            }
            return {
                ...remote,
                filename: (0, source_control_helper_ee_1.getCredentialExportPath)(remote.id, this.credentialExportFolder),
            };
        }));
        return remoteCredentialFilesParsed.filter((e) => e !== undefined);
    }
    async getLocalCredentialsFromDb() {
        const localCredentials = await typedi_1.Container.get(credentials_repository_1.CredentialsRepository).find({
            select: ['id', 'name', 'type'],
        });
        return localCredentials.map((local) => ({
            id: local.id,
            name: local.name,
            type: local.type,
            filename: (0, source_control_helper_ee_1.getCredentialExportPath)(local.id, this.credentialExportFolder),
        }));
    }
    async getRemoteVariablesFromFile() {
        const variablesFile = await (0, fast_glob_1.default)(constants_1.SOURCE_CONTROL_VARIABLES_EXPORT_FILE, {
            cwd: this.gitFolder,
            absolute: true,
        });
        if (variablesFile.length > 0) {
            this.logger.debug(`Importing variables from file ${variablesFile[0]}`);
            return (0, n8n_workflow_1.jsonParse)(await (0, promises_1.readFile)(variablesFile[0], { encoding: 'utf8' }), {
                fallbackValue: [],
            });
        }
        return [];
    }
    async getLocalVariablesFromDb() {
        return await this.variablesService.getAllCached();
    }
    async getRemoteTagsAndMappingsFromFile() {
        const tagsFile = await (0, fast_glob_1.default)(constants_1.SOURCE_CONTROL_TAGS_EXPORT_FILE, {
            cwd: this.gitFolder,
            absolute: true,
        });
        if (tagsFile.length > 0) {
            this.logger.debug(`Importing tags from file ${tagsFile[0]}`);
            const mappedTags = (0, n8n_workflow_1.jsonParse)(await (0, promises_1.readFile)(tagsFile[0], { encoding: 'utf8' }), { fallbackValue: { tags: [], mappings: [] } });
            return mappedTags;
        }
        return { tags: [], mappings: [] };
    }
    async getLocalTagsAndMappingsFromDb() {
        const localTags = await this.tagRepository.find({
            select: ['id', 'name'],
        });
        const localMappings = await typedi_1.Container.get(workflow_tag_mapping_repository_1.WorkflowTagMappingRepository).find({
            select: ['workflowId', 'tagId'],
        });
        return { tags: localTags, mappings: localMappings };
    }
    async importWorkflowFromWorkFolder(candidates, userId) {
        const personalProject = await typedi_1.Container.get(project_repository_1.ProjectRepository).getPersonalProjectForUserOrFail(userId);
        const workflowManager = this.activeWorkflowManager;
        const candidateIds = candidates.map((c) => c.id);
        const existingWorkflows = await typedi_1.Container.get(workflow_repository_1.WorkflowRepository).findByIds(candidateIds, {
            fields: ['id', 'name', 'versionId', 'active'],
        });
        const allSharedWorkflows = await typedi_1.Container.get(shared_workflow_repository_1.SharedWorkflowRepository).findWithFields(candidateIds, { select: ['workflowId', 'role', 'projectId'] });
        const importWorkflowsResult = [];
        for (const candidate of candidates) {
            this.logger.debug(`Parsing workflow file ${candidate.file}`);
            const importedWorkflow = (0, n8n_workflow_1.jsonParse)(await (0, promises_1.readFile)(candidate.file, { encoding: 'utf8' }));
            if (!importedWorkflow?.id) {
                continue;
            }
            const existingWorkflow = existingWorkflows.find((e) => e.id === importedWorkflow.id);
            importedWorkflow.active = existingWorkflow?.active ?? false;
            this.logger.debug(`Updating workflow id ${importedWorkflow.id ?? 'new'}`);
            const upsertResult = await typedi_1.Container.get(workflow_repository_1.WorkflowRepository).upsert({ ...importedWorkflow }, [
                'id',
            ]);
            if (upsertResult?.identifiers?.length !== 1) {
                throw new n8n_workflow_1.ApplicationError('Failed to upsert workflow', {
                    extra: { workflowId: importedWorkflow.id ?? 'new' },
                });
            }
            const isOwnedLocally = allSharedWorkflows.some((w) => w.workflowId === importedWorkflow.id && w.role === 'workflow:owner');
            if (!isOwnedLocally) {
                const remoteOwnerProject = importedWorkflow.owner
                    ? await this.findOrCreateOwnerProject(importedWorkflow.owner)
                    : null;
                await typedi_1.Container.get(shared_workflow_repository_1.SharedWorkflowRepository).upsert({
                    workflowId: importedWorkflow.id,
                    projectId: remoteOwnerProject?.id ?? personalProject.id,
                    role: 'workflow:owner',
                }, ['workflowId', 'projectId']);
            }
            if (existingWorkflow?.active) {
                try {
                    this.logger.debug(`Deactivating workflow id ${existingWorkflow.id}`);
                    await workflowManager.remove(existingWorkflow.id);
                    this.logger.debug(`Reactivating workflow id ${existingWorkflow.id}`);
                    await workflowManager.add(existingWorkflow.id, 'activate');
                }
                catch (e) {
                    const error = (0, n8n_workflow_1.ensureError)(e);
                    this.logger.error(`Failed to activate workflow ${existingWorkflow.id}`, { error });
                }
                finally {
                    await typedi_1.Container.get(workflow_repository_1.WorkflowRepository).update({ id: existingWorkflow.id }, { versionId: importedWorkflow.versionId });
                }
            }
            importWorkflowsResult.push({
                id: importedWorkflow.id ?? 'unknown',
                name: candidate.file,
            });
        }
        return importWorkflowsResult.filter((e) => e !== undefined);
    }
    async importCredentialsFromWorkFolder(candidates, userId) {
        const personalProject = await typedi_1.Container.get(project_repository_1.ProjectRepository).getPersonalProjectForUserOrFail(userId);
        const candidateIds = candidates.map((c) => c.id);
        const existingCredentials = await typedi_1.Container.get(credentials_repository_1.CredentialsRepository).find({
            where: {
                id: (0, typeorm_1.In)(candidateIds),
            },
            select: ['id', 'name', 'type', 'data'],
        });
        const existingSharedCredentials = await typedi_1.Container.get(shared_credentials_repository_1.SharedCredentialsRepository).find({
            select: ['credentialsId', 'role'],
            where: {
                credentialsId: (0, typeorm_1.In)(candidateIds),
                role: 'credential:owner',
            },
        });
        let importCredentialsResult = [];
        importCredentialsResult = await Promise.all(candidates.map(async (candidate) => {
            this.logger.debug(`Importing credentials file ${candidate.file}`);
            const credential = (0, n8n_workflow_1.jsonParse)(await (0, promises_1.readFile)(candidate.file, { encoding: 'utf8' }));
            const existingCredential = existingCredentials.find((e) => e.id === credential.id && e.type === credential.type);
            const { name, type, data, id } = credential;
            const newCredentialObject = new n8n_core_1.Credentials({ id, name }, type);
            if (existingCredential?.data) {
                newCredentialObject.data = existingCredential.data;
            }
            else {
                const { oauthTokenData, ...rest } = data;
                newCredentialObject.setData(rest);
            }
            this.logger.debug(`Updating credential id ${newCredentialObject.id}`);
            await typedi_1.Container.get(credentials_repository_1.CredentialsRepository).upsert(newCredentialObject, ['id']);
            const isOwnedLocally = existingSharedCredentials.some((c) => c.credentialsId === credential.id && c.role === 'credential:owner');
            if (!isOwnedLocally) {
                const remoteOwnerProject = credential.ownedBy
                    ? await this.findOrCreateOwnerProject(credential.ownedBy)
                    : null;
                const newSharedCredential = new shared_credentials_1.SharedCredentials();
                newSharedCredential.credentialsId = newCredentialObject.id;
                newSharedCredential.projectId = remoteOwnerProject?.id ?? personalProject.id;
                newSharedCredential.role = 'credential:owner';
                await typedi_1.Container.get(shared_credentials_repository_1.SharedCredentialsRepository).upsert({ ...newSharedCredential }, [
                    'credentialsId',
                    'projectId',
                ]);
            }
            return {
                id: newCredentialObject.id,
                name: newCredentialObject.name,
                type: newCredentialObject.type,
            };
        }));
        return importCredentialsResult.filter((e) => e !== undefined);
    }
    async importTagsFromWorkFolder(candidate) {
        let mappedTags;
        try {
            this.logger.debug(`Importing tags from file ${candidate.file}`);
            mappedTags = (0, n8n_workflow_1.jsonParse)(await (0, promises_1.readFile)(candidate.file, { encoding: 'utf8' }), { fallbackValue: { tags: [], mappings: [] } });
        }
        catch (e) {
            const error = (0, n8n_workflow_1.ensureError)(e);
            this.logger.error(`Failed to import tags from file ${candidate.file}`, { error });
            return;
        }
        if (mappedTags.mappings.length === 0 && mappedTags.tags.length === 0) {
            return;
        }
        const existingWorkflowIds = new Set((await typedi_1.Container.get(workflow_repository_1.WorkflowRepository).find({
            select: ['id'],
        })).map((e) => e.id));
        await Promise.all(mappedTags.tags.map(async (tag) => {
            const findByName = await this.tagRepository.findOne({
                where: { name: tag.name },
                select: ['id'],
            });
            if (findByName && findByName.id !== tag.id) {
                throw new n8n_workflow_1.ApplicationError(`A tag with the name <strong>${tag.name}</strong> already exists locally.<br />Please either rename the local tag, or the remote one with the id <strong>${tag.id}</strong> in the tags.json file.`);
            }
            const tagCopy = this.tagRepository.create(tag);
            await this.tagRepository.upsert(tagCopy, {
                skipUpdateIfNoValuesChanged: true,
                conflictPaths: { id: true },
            });
        }));
        await Promise.all(mappedTags.mappings.map(async (mapping) => {
            if (!existingWorkflowIds.has(String(mapping.workflowId)))
                return;
            await typedi_1.Container.get(workflow_tag_mapping_repository_1.WorkflowTagMappingRepository).upsert({ tagId: String(mapping.tagId), workflowId: String(mapping.workflowId) }, {
                skipUpdateIfNoValuesChanged: true,
                conflictPaths: { tagId: true, workflowId: true },
            });
        }));
        return mappedTags;
    }
    async importVariablesFromWorkFolder(candidate, valueOverrides) {
        const result = { imported: [] };
        let importedVariables;
        try {
            this.logger.debug(`Importing variables from file ${candidate.file}`);
            importedVariables = (0, n8n_workflow_1.jsonParse)(await (0, promises_1.readFile)(candidate.file, { encoding: 'utf8' }), { fallbackValue: [] });
        }
        catch (e) {
            this.logger.error(`Failed to import tags from file ${candidate.file}`, { error: e });
            return;
        }
        const overriddenKeys = Object.keys(valueOverrides ?? {});
        for (const variable of importedVariables) {
            if (!variable.key) {
                continue;
            }
            if (variable.value === '') {
                variable.value = undefined;
            }
            if (overriddenKeys.includes(variable.key) && valueOverrides) {
                variable.value = valueOverrides[variable.key];
                overriddenKeys.splice(overriddenKeys.indexOf(variable.key), 1);
            }
            try {
                await typedi_1.Container.get(variables_repository_1.VariablesRepository).upsert({ ...variable }, ['id']);
            }
            catch (errorUpsert) {
                if ((0, response_helper_1.isUniqueConstraintError)(errorUpsert)) {
                    this.logger.debug(`Variable ${variable.key} already exists, updating instead`);
                    try {
                        await typedi_1.Container.get(variables_repository_1.VariablesRepository).update({ key: variable.key }, { ...variable });
                    }
                    catch (errorUpdate) {
                        this.logger.debug(`Failed to update variable ${variable.key}, skipping`);
                        this.logger.debug(errorUpdate.message);
                    }
                }
            }
            finally {
                result.imported.push(variable.key);
            }
        }
        if (overriddenKeys.length > 0 && valueOverrides) {
            for (const key of overriddenKeys) {
                result.imported.push(key);
                const newVariable = typedi_1.Container.get(variables_repository_1.VariablesRepository).create({
                    key,
                    value: valueOverrides[key],
                });
                await typedi_1.Container.get(variables_repository_1.VariablesRepository).save(newVariable, { transaction: false });
            }
        }
        await this.variablesService.updateCache();
        return result;
    }
    async findOrCreateOwnerProject(owner) {
        const projectRepository = typedi_1.Container.get(project_repository_1.ProjectRepository);
        const userRepository = typedi_1.Container.get(user_repository_1.UserRepository);
        if (typeof owner === 'string' || owner.type === 'personal') {
            const email = typeof owner === 'string' ? owner : owner.personalEmail;
            const user = await userRepository.findOne({
                where: { email },
            });
            if (!user) {
                return null;
            }
            return await projectRepository.getPersonalProjectForUserOrFail(user.id);
        }
        else if (owner.type === 'team') {
            let teamProject = await projectRepository.findOne({
                where: { id: owner.teamId },
            });
            if (!teamProject) {
                try {
                    teamProject = await projectRepository.save(projectRepository.create({
                        id: owner.teamId,
                        name: owner.teamName,
                        type: 'team',
                    }));
                }
                catch (e) {
                    teamProject = await projectRepository.findOne({
                        where: { id: owner.teamId },
                    });
                    if (!teamProject) {
                        throw e;
                    }
                }
            }
            return teamProject;
        }
        (0, utils_1.assertNever)(owner);
        const errorOwner = owner;
        throw new n8n_workflow_1.ApplicationError(`Unknown resource owner type "${typeof errorOwner !== 'string' ? errorOwner.type : 'UNKNOWN'}" found when importing from source controller`);
    }
};
exports.SourceControlImportService = SourceControlImportService;
exports.SourceControlImportService = SourceControlImportService = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [logger_service_1.Logger,
        variables_service_ee_1.VariablesService,
        active_workflow_manager_1.ActiveWorkflowManager,
        tag_repository_1.TagRepository,
        n8n_core_1.InstanceSettings])
], SourceControlImportService);
//# sourceMappingURL=source-control-import.service.ee.js.map