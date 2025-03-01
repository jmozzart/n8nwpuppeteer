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
exports.SourceControlService = void 0;
const fs_1 = require("fs");
const n8n_workflow_1 = require("n8n-workflow");
const path_1 = __importDefault(require("path"));
const typedi_1 = require("typedi");
const tag_repository_1 = require("../../databases/repositories/tag.repository");
const bad_request_error_1 = require("../../errors/response-errors/bad-request.error");
const event_service_1 = require("../../events/event.service");
const logger_service_1 = require("../../logging/logger.service");
const constants_1 = require("./constants");
const source_control_export_service_ee_1 = require("./source-control-export.service.ee");
const source_control_git_service_ee_1 = require("./source-control-git.service.ee");
const source_control_helper_ee_1 = require("./source-control-helper.ee");
const source_control_import_service_ee_1 = require("./source-control-import.service.ee");
const source_control_preferences_service_ee_1 = require("./source-control-preferences.service.ee");
let SourceControlService = class SourceControlService {
    constructor(logger, gitService, sourceControlPreferencesService, sourceControlExportService, sourceControlImportService, tagRepository, eventService) {
        this.logger = logger;
        this.gitService = gitService;
        this.sourceControlPreferencesService = sourceControlPreferencesService;
        this.sourceControlExportService = sourceControlExportService;
        this.sourceControlImportService = sourceControlImportService;
        this.tagRepository = tagRepository;
        this.eventService = eventService;
        const { gitFolder, sshFolder, sshKeyName } = sourceControlPreferencesService;
        this.gitFolder = gitFolder;
        this.sshFolder = sshFolder;
        this.sshKeyName = sshKeyName;
    }
    async init() {
        this.gitService.resetService();
        (0, source_control_helper_ee_1.sourceControlFoldersExistCheck)([this.gitFolder, this.sshFolder]);
        await this.sourceControlPreferencesService.loadFromDbAndApplySourceControlPreferences();
        if (this.sourceControlPreferencesService.isSourceControlLicensedAndEnabled()) {
            await this.initGitService();
        }
    }
    async initGitService() {
        await this.gitService.initService({
            sourceControlPreferences: this.sourceControlPreferencesService.getPreferences(),
            gitFolder: this.gitFolder,
            sshKeyName: this.sshKeyName,
            sshFolder: this.sshFolder,
        });
    }
    async sanityCheck() {
        try {
            const foldersExisted = (0, source_control_helper_ee_1.sourceControlFoldersExistCheck)([this.gitFolder, this.sshFolder], false);
            if (!foldersExisted) {
                throw new n8n_workflow_1.ApplicationError('No folders exist');
            }
            if (!this.gitService.git) {
                await this.initGitService();
            }
            const branches = await this.gitService.getCurrentBranch();
            if (branches.current === '' ||
                branches.current !==
                    this.sourceControlPreferencesService.sourceControlPreferences.branchName) {
                throw new n8n_workflow_1.ApplicationError('Branch is not set up correctly');
            }
        }
        catch (error) {
            throw new bad_request_error_1.BadRequestError('Source control is not properly set up, please disconnect and reconnect.');
        }
    }
    async disconnect(options = {}) {
        try {
            await this.sourceControlPreferencesService.setPreferences({
                connected: false,
                branchName: '',
            });
            await this.sourceControlExportService.deleteRepositoryFolder();
            if (!options.keepKeyPair) {
                await this.sourceControlPreferencesService.deleteKeyPair();
            }
            this.gitService.resetService();
            return this.sourceControlPreferencesService.sourceControlPreferences;
        }
        catch (error) {
            throw new n8n_workflow_1.ApplicationError('Failed to disconnect from source control', { cause: error });
        }
    }
    async initializeRepository(preferences, user) {
        if (!this.gitService.git) {
            await this.initGitService();
        }
        this.logger.debug('Initializing repository...');
        await this.gitService.initRepository(preferences, user);
        let getBranchesResult;
        try {
            getBranchesResult = await this.getBranches();
        }
        catch (error) {
            if (error.message.includes('Warning: Permanently added')) {
                this.logger.debug('Added repository host to the list of known hosts. Retrying...');
                getBranchesResult = await this.getBranches();
            }
            else {
                throw error;
            }
        }
        if (getBranchesResult.branches.includes(preferences.branchName)) {
            await this.gitService.setBranch(preferences.branchName);
        }
        else {
            if (getBranchesResult.branches?.length === 0) {
                try {
                    (0, fs_1.writeFileSync)(path_1.default.join(this.gitFolder, '/README.md'), constants_1.SOURCE_CONTROL_README);
                    await this.gitService.stage(new Set(['README.md']));
                    await this.gitService.commit('Initial commit');
                    await this.gitService.push({
                        branch: preferences.branchName,
                        force: true,
                    });
                    getBranchesResult = await this.getBranches();
                    await this.gitService.setBranch(preferences.branchName);
                }
                catch (fileError) {
                    this.logger.error(`Failed to create initial commit: ${fileError.message}`);
                }
            }
        }
        await this.sourceControlPreferencesService.setPreferences({
            branchName: getBranchesResult.currentBranch,
            connected: true,
        });
        return getBranchesResult;
    }
    async getBranches() {
        if (!this.gitService.git) {
            await this.initGitService();
        }
        await this.gitService.fetch();
        return await this.gitService.getBranches();
    }
    async setBranch(branch) {
        if (!this.gitService.git) {
            await this.initGitService();
        }
        await this.sourceControlPreferencesService.setPreferences({
            branchName: branch,
            connected: branch?.length > 0,
        });
        return await this.gitService.setBranch(branch);
    }
    async resetWorkfolder() {
        if (!this.gitService.git) {
            await this.initGitService();
        }
        try {
            await this.gitService.resetBranch();
            await this.gitService.pull();
        }
        catch (error) {
            this.logger.error(`Failed to reset workfolder: ${error.message}`);
            throw new n8n_workflow_1.ApplicationError('Unable to fetch updates from git - your folder might be out of sync. Try reconnecting from the Source Control settings page.');
        }
        return;
    }
    async pushWorkfolder(options) {
        await this.sanityCheck();
        if (this.sourceControlPreferencesService.isBranchReadOnly()) {
            throw new bad_request_error_1.BadRequestError('Cannot push onto read-only branch.');
        }
        const filesToPush = options.fileNames.map((file) => {
            const normalizedPath = (0, source_control_helper_ee_1.normalizeAndValidateSourceControlledFilePath)(this.gitFolder, file.file);
            return {
                ...file,
                file: normalizedPath,
            };
        });
        let statusResult = filesToPush;
        if (statusResult.length === 0) {
            statusResult = (await this.getStatus({
                direction: 'push',
                verbose: false,
                preferLocalVersion: true,
            }));
        }
        if (!options.force) {
            const possibleConflicts = statusResult?.filter((file) => file.conflict);
            if (possibleConflicts?.length > 0) {
                return {
                    statusCode: 409,
                    pushResult: undefined,
                    statusResult,
                };
            }
        }
        const filesToBePushed = new Set();
        const filesToBeDeleted = new Set();
        filesToPush.forEach((e) => {
            if (e.status !== 'deleted') {
                filesToBePushed.add(e.file);
            }
            else {
                filesToBeDeleted.add(e.file);
            }
        });
        this.sourceControlExportService.rmFilesFromExportFolder(filesToBeDeleted);
        const workflowsToBeExported = filesToPush.filter((e) => e.type === 'workflow' && e.status !== 'deleted');
        await this.sourceControlExportService.exportWorkflowsToWorkFolder(workflowsToBeExported);
        const credentialsToBeExported = filesToPush.filter((e) => e.type === 'credential' && e.status !== 'deleted');
        const credentialExportResult = await this.sourceControlExportService.exportCredentialsToWorkFolder(credentialsToBeExported);
        if (credentialExportResult.missingIds && credentialExportResult.missingIds.length > 0) {
            credentialExportResult.missingIds.forEach((id) => {
                filesToBePushed.delete(this.sourceControlExportService.getCredentialsPath(id));
                statusResult = statusResult.filter((e) => e.file !== this.sourceControlExportService.getCredentialsPath(id));
            });
        }
        if (filesToPush.find((e) => e.type === 'tags')) {
            await this.sourceControlExportService.exportTagsToWorkFolder();
        }
        if (filesToPush.find((e) => e.type === 'variables')) {
            await this.sourceControlExportService.exportVariablesToWorkFolder();
        }
        await this.gitService.stage(filesToBePushed, filesToBeDeleted);
        for (let i = 0; i < statusResult.length; i++) {
            if (filesToPush.find((file) => file.file === statusResult[i].file)) {
                statusResult[i].pushed = true;
            }
        }
        await this.gitService.commit(options.message ?? 'Updated Workfolder');
        const pushResult = await this.gitService.push({
            branch: this.sourceControlPreferencesService.getBranchName(),
            force: options.force ?? false,
        });
        this.eventService.emit('source-control-user-finished-push-ui', (0, source_control_helper_ee_1.getTrackingInformationFromPostPushResult)(statusResult));
        return {
            statusCode: 200,
            pushResult,
            statusResult,
        };
    }
    async pullWorkfolder(options) {
        await this.sanityCheck();
        const statusResult = (await this.getStatus({
            direction: 'pull',
            verbose: false,
            preferLocalVersion: false,
        }));
        const filteredResult = statusResult.filter((e) => {
            if (e.status === 'created' && e.location === 'local') {
                return false;
            }
            if (e.type === 'credential' && e.status === 'deleted') {
                return false;
            }
            return true;
        });
        if (options.force !== true) {
            const possibleConflicts = filteredResult?.filter((file) => (file.conflict || file.status === 'modified') && file.type === 'workflow');
            if (possibleConflicts?.length > 0) {
                await this.gitService.resetBranch();
                return {
                    statusCode: 409,
                    statusResult: filteredResult,
                };
            }
        }
        const workflowsToBeImported = statusResult.filter((e) => e.type === 'workflow' && e.status !== 'deleted');
        await this.sourceControlImportService.importWorkflowFromWorkFolder(workflowsToBeImported, options.userId);
        const credentialsToBeImported = statusResult.filter((e) => e.type === 'credential' && e.status !== 'deleted');
        await this.sourceControlImportService.importCredentialsFromWorkFolder(credentialsToBeImported, options.userId);
        const tagsToBeImported = statusResult.find((e) => e.type === 'tags');
        if (tagsToBeImported) {
            await this.sourceControlImportService.importTagsFromWorkFolder(tagsToBeImported);
        }
        const variablesToBeImported = statusResult.find((e) => e.type === 'variables');
        if (variablesToBeImported) {
            await this.sourceControlImportService.importVariablesFromWorkFolder(variablesToBeImported);
        }
        this.eventService.emit('source-control-user-finished-pull-ui', (0, source_control_helper_ee_1.getTrackingInformationFromPullResult)(statusResult));
        return {
            statusCode: 200,
            statusResult: filteredResult,
        };
    }
    async getStatus(options) {
        await this.sanityCheck();
        const sourceControlledFiles = [];
        await this.resetWorkfolder();
        const { wfRemoteVersionIds, wfLocalVersionIds, wfMissingInLocal, wfMissingInRemote, wfModifiedInEither, } = await this.getStatusWorkflows(options, sourceControlledFiles);
        const { credMissingInLocal, credMissingInRemote, credModifiedInEither } = await this.getStatusCredentials(options, sourceControlledFiles);
        const { varMissingInLocal, varMissingInRemote, varModifiedInEither } = await this.getStatusVariables(options, sourceControlledFiles);
        const { tagsMissingInLocal, tagsMissingInRemote, tagsModifiedInEither, mappingsMissingInLocal, mappingsMissingInRemote, } = await this.getStatusTagsMappings(options, sourceControlledFiles);
        if (options.direction === 'push') {
            this.eventService.emit('source-control-user-started-push-ui', (0, source_control_helper_ee_1.getTrackingInformationFromPrePushResult)(sourceControlledFiles));
        }
        else if (options.direction === 'pull') {
            this.eventService.emit('source-control-user-started-pull-ui', (0, source_control_helper_ee_1.getTrackingInformationFromPullResult)(sourceControlledFiles));
        }
        if (options?.verbose) {
            return {
                wfRemoteVersionIds,
                wfLocalVersionIds,
                wfMissingInLocal,
                wfMissingInRemote,
                wfModifiedInEither,
                credMissingInLocal,
                credMissingInRemote,
                credModifiedInEither,
                varMissingInLocal,
                varMissingInRemote,
                varModifiedInEither,
                tagsMissingInLocal,
                tagsMissingInRemote,
                tagsModifiedInEither,
                mappingsMissingInLocal,
                mappingsMissingInRemote,
                sourceControlledFiles,
            };
        }
        else {
            return sourceControlledFiles;
        }
    }
    async getStatusWorkflows(options, sourceControlledFiles) {
        const wfRemoteVersionIds = await this.sourceControlImportService.getRemoteVersionIdsFromFiles();
        const wfLocalVersionIds = await this.sourceControlImportService.getLocalVersionIdsFromDb();
        const wfMissingInLocal = wfRemoteVersionIds.filter((remote) => wfLocalVersionIds.findIndex((local) => local.id === remote.id) === -1);
        const wfMissingInRemote = wfLocalVersionIds.filter((local) => wfRemoteVersionIds.findIndex((remote) => remote.id === local.id) === -1);
        const wfModifiedInEither = [];
        wfLocalVersionIds.forEach((local) => {
            const mismatchingIds = wfRemoteVersionIds.find((remote) => remote.id === local.id && remote.versionId !== local.versionId);
            let name = (options?.preferLocalVersion ? local?.name : mismatchingIds?.name) ?? 'Workflow';
            if (local.name && mismatchingIds?.name && local.name !== mismatchingIds.name) {
                name = options?.preferLocalVersion
                    ? `${local.name} (Remote: ${mismatchingIds.name})`
                    : (name = `${mismatchingIds.name} (Local: ${local.name})`);
            }
            if (mismatchingIds) {
                wfModifiedInEither.push({
                    ...local,
                    name,
                    versionId: options.preferLocalVersion ? local.versionId : mismatchingIds.versionId,
                    localId: local.versionId,
                    remoteId: mismatchingIds.versionId,
                });
            }
        });
        wfMissingInLocal.forEach((item) => {
            sourceControlledFiles.push({
                id: item.id,
                name: item.name ?? 'Workflow',
                type: 'workflow',
                status: options.direction === 'push' ? 'deleted' : 'created',
                location: options.direction === 'push' ? 'local' : 'remote',
                conflict: false,
                file: item.filename,
                updatedAt: item.updatedAt ?? new Date().toISOString(),
            });
        });
        wfMissingInRemote.forEach((item) => {
            sourceControlledFiles.push({
                id: item.id,
                name: item.name ?? 'Workflow',
                type: 'workflow',
                status: options.direction === 'push' ? 'created' : 'deleted',
                location: options.direction === 'push' ? 'local' : 'remote',
                conflict: false,
                file: item.filename,
                updatedAt: item.updatedAt ?? new Date().toISOString(),
            });
        });
        wfModifiedInEither.forEach((item) => {
            sourceControlledFiles.push({
                id: item.id,
                name: item.name ?? 'Workflow',
                type: 'workflow',
                status: 'modified',
                location: options.direction === 'push' ? 'local' : 'remote',
                conflict: true,
                file: item.filename,
                updatedAt: item.updatedAt ?? new Date().toISOString(),
            });
        });
        return {
            wfRemoteVersionIds,
            wfLocalVersionIds,
            wfMissingInLocal,
            wfMissingInRemote,
            wfModifiedInEither,
        };
    }
    async getStatusCredentials(options, sourceControlledFiles) {
        const credRemoteIds = await this.sourceControlImportService.getRemoteCredentialsFromFiles();
        const credLocalIds = await this.sourceControlImportService.getLocalCredentialsFromDb();
        const credMissingInLocal = credRemoteIds.filter((remote) => credLocalIds.findIndex((local) => local.id === remote.id) === -1);
        const credMissingInRemote = credLocalIds.filter((local) => credRemoteIds.findIndex((remote) => remote.id === local.id) === -1);
        const credModifiedInEither = [];
        credLocalIds.forEach((local) => {
            const mismatchingCreds = credRemoteIds.find((remote) => {
                return remote.id === local.id && (remote.name !== local.name || remote.type !== local.type);
            });
            if (mismatchingCreds) {
                credModifiedInEither.push({
                    ...local,
                    name: options?.preferLocalVersion ? local.name : mismatchingCreds.name,
                });
            }
        });
        credMissingInLocal.forEach((item) => {
            sourceControlledFiles.push({
                id: item.id,
                name: item.name ?? 'Credential',
                type: 'credential',
                status: options.direction === 'push' ? 'deleted' : 'created',
                location: options.direction === 'push' ? 'local' : 'remote',
                conflict: false,
                file: item.filename,
                updatedAt: new Date().toISOString(),
            });
        });
        credMissingInRemote.forEach((item) => {
            sourceControlledFiles.push({
                id: item.id,
                name: item.name ?? 'Credential',
                type: 'credential',
                status: options.direction === 'push' ? 'created' : 'deleted',
                location: options.direction === 'push' ? 'local' : 'remote',
                conflict: false,
                file: item.filename,
                updatedAt: new Date().toISOString(),
            });
        });
        credModifiedInEither.forEach((item) => {
            sourceControlledFiles.push({
                id: item.id,
                name: item.name ?? 'Credential',
                type: 'credential',
                status: 'modified',
                location: options.direction === 'push' ? 'local' : 'remote',
                conflict: true,
                file: item.filename,
                updatedAt: new Date().toISOString(),
            });
        });
        return {
            credMissingInLocal,
            credMissingInRemote,
            credModifiedInEither,
        };
    }
    async getStatusVariables(options, sourceControlledFiles) {
        const varRemoteIds = await this.sourceControlImportService.getRemoteVariablesFromFile();
        const varLocalIds = await this.sourceControlImportService.getLocalVariablesFromDb();
        const varMissingInLocal = varRemoteIds.filter((remote) => varLocalIds.findIndex((local) => local.id === remote.id) === -1);
        const varMissingInRemote = varLocalIds.filter((local) => varRemoteIds.findIndex((remote) => remote.id === local.id) === -1);
        const varModifiedInEither = [];
        varLocalIds.forEach((local) => {
            const mismatchingIds = varRemoteIds.find((remote) => (remote.id === local.id && remote.key !== local.key) ||
                (remote.id !== local.id && remote.key === local.key));
            if (mismatchingIds) {
                varModifiedInEither.push(options.preferLocalVersion ? local : mismatchingIds);
            }
        });
        if (varMissingInLocal.length > 0 ||
            varMissingInRemote.length > 0 ||
            varModifiedInEither.length > 0) {
            if (options.direction === 'pull' && varRemoteIds.length === 0) {
            }
            else {
                sourceControlledFiles.push({
                    id: 'variables',
                    name: 'variables',
                    type: 'variables',
                    status: 'modified',
                    location: options.direction === 'push' ? 'local' : 'remote',
                    conflict: false,
                    file: (0, source_control_helper_ee_1.getVariablesPath)(this.gitFolder),
                    updatedAt: new Date().toISOString(),
                });
            }
        }
        return {
            varMissingInLocal,
            varMissingInRemote,
            varModifiedInEither,
        };
    }
    async getStatusTagsMappings(options, sourceControlledFiles) {
        const lastUpdatedTag = await this.tagRepository.find({
            order: { updatedAt: 'DESC' },
            take: 1,
            select: ['updatedAt'],
        });
        const tagMappingsRemote = await this.sourceControlImportService.getRemoteTagsAndMappingsFromFile();
        const tagMappingsLocal = await this.sourceControlImportService.getLocalTagsAndMappingsFromDb();
        const tagsMissingInLocal = tagMappingsRemote.tags.filter((remote) => tagMappingsLocal.tags.findIndex((local) => local.id === remote.id) === -1);
        const tagsMissingInRemote = tagMappingsLocal.tags.filter((local) => tagMappingsRemote.tags.findIndex((remote) => remote.id === local.id) === -1);
        const tagsModifiedInEither = [];
        tagMappingsLocal.tags.forEach((local) => {
            const mismatchingIds = tagMappingsRemote.tags.find((remote) => remote.id === local.id && remote.name !== local.name);
            if (!mismatchingIds) {
                return;
            }
            tagsModifiedInEither.push(options.preferLocalVersion ? local : mismatchingIds);
        });
        const mappingsMissingInLocal = tagMappingsRemote.mappings.filter((remote) => tagMappingsLocal.mappings.findIndex((local) => local.tagId === remote.tagId && local.workflowId === remote.workflowId) === -1);
        const mappingsMissingInRemote = tagMappingsLocal.mappings.filter((local) => tagMappingsRemote.mappings.findIndex((remote) => remote.tagId === local.tagId && remote.workflowId === remote.workflowId) === -1);
        if (tagsMissingInLocal.length > 0 ||
            tagsMissingInRemote.length > 0 ||
            tagsModifiedInEither.length > 0 ||
            mappingsMissingInLocal.length > 0 ||
            mappingsMissingInRemote.length > 0) {
            if (options.direction === 'pull' &&
                tagMappingsRemote.tags.length === 0 &&
                tagMappingsRemote.mappings.length === 0) {
            }
            else {
                sourceControlledFiles.push({
                    id: 'mappings',
                    name: 'tags',
                    type: 'tags',
                    status: 'modified',
                    location: options.direction === 'push' ? 'local' : 'remote',
                    conflict: false,
                    file: (0, source_control_helper_ee_1.getTagsPath)(this.gitFolder),
                    updatedAt: lastUpdatedTag[0]?.updatedAt.toISOString(),
                });
            }
        }
        return {
            tagsMissingInLocal,
            tagsMissingInRemote,
            tagsModifiedInEither,
            mappingsMissingInLocal,
            mappingsMissingInRemote,
        };
    }
    async setGitUserDetails(name = constants_1.SOURCE_CONTROL_DEFAULT_NAME, email = constants_1.SOURCE_CONTROL_DEFAULT_EMAIL) {
        await this.sanityCheck();
        await this.gitService.setGitUserDetails(name, email);
    }
};
exports.SourceControlService = SourceControlService;
exports.SourceControlService = SourceControlService = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [logger_service_1.Logger,
        source_control_git_service_ee_1.SourceControlGitService,
        source_control_preferences_service_ee_1.SourceControlPreferencesService,
        source_control_export_service_ee_1.SourceControlExportService,
        source_control_import_service_ee_1.SourceControlImportService,
        tag_repository_1.TagRepository,
        event_service_1.EventService])
], SourceControlService);
//# sourceMappingURL=source-control.service.ee.js.map