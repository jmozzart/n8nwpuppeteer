import type { PushResult } from 'simple-git';
import type { TagEntity } from '../../databases/entities/tag-entity';
import type { User } from '../../databases/entities/user';
import type { Variables } from '../../databases/entities/variables';
import { TagRepository } from '../../databases/repositories/tag.repository';
import { EventService } from '../../events/event.service';
import { Logger } from '../../logging/logger.service';
import { SourceControlExportService } from './source-control-export.service.ee';
import { SourceControlGitService } from './source-control-git.service.ee';
import { SourceControlImportService } from './source-control-import.service.ee';
import { SourceControlPreferencesService } from './source-control-preferences.service.ee';
import type { ExportableCredential } from './types/exportable-credential';
import type { ImportResult } from './types/import-result';
import type { SourceControlGetStatus } from './types/source-control-get-status';
import type { SourceControlPreferences } from './types/source-control-preferences';
import type { SourceControllPullOptions } from './types/source-control-pull-work-folder';
import type { SourceControlPushWorkFolder } from './types/source-control-push-work-folder';
import type { SourceControlWorkflowVersionId } from './types/source-control-workflow-version-id';
import type { SourceControlledFile } from './types/source-controlled-file';
export declare class SourceControlService {
    private readonly logger;
    private gitService;
    private sourceControlPreferencesService;
    private sourceControlExportService;
    private sourceControlImportService;
    private tagRepository;
    private readonly eventService;
    private sshKeyName;
    private sshFolder;
    private gitFolder;
    constructor(logger: Logger, gitService: SourceControlGitService, sourceControlPreferencesService: SourceControlPreferencesService, sourceControlExportService: SourceControlExportService, sourceControlImportService: SourceControlImportService, tagRepository: TagRepository, eventService: EventService);
    init(): Promise<void>;
    private initGitService;
    sanityCheck(): Promise<void>;
    disconnect(options?: {
        keepKeyPair?: boolean;
    }): Promise<SourceControlPreferences>;
    initializeRepository(preferences: SourceControlPreferences, user: User): Promise<{
        branches: string[];
        currentBranch: string;
    }>;
    getBranches(): Promise<{
        branches: string[];
        currentBranch: string;
    }>;
    setBranch(branch: string): Promise<{
        branches: string[];
        currentBranch: string;
    }>;
    resetWorkfolder(): Promise<ImportResult | undefined>;
    pushWorkfolder(options: SourceControlPushWorkFolder): Promise<{
        statusCode: number;
        pushResult: PushResult | undefined;
        statusResult: SourceControlledFile[];
    }>;
    pullWorkfolder(options: SourceControllPullOptions): Promise<{
        statusCode: number;
        statusResult: SourceControlledFile[];
    }>;
    getStatus(options: SourceControlGetStatus): Promise<SourceControlledFile[] | {
        wfRemoteVersionIds: SourceControlWorkflowVersionId[];
        wfLocalVersionIds: SourceControlWorkflowVersionId[];
        wfMissingInLocal: SourceControlWorkflowVersionId[];
        wfMissingInRemote: SourceControlWorkflowVersionId[];
        wfModifiedInEither: SourceControlWorkflowVersionId[];
        credMissingInLocal: (ExportableCredential & {
            filename: string;
        })[];
        credMissingInRemote: (ExportableCredential & {
            filename: string;
        })[];
        credModifiedInEither: (ExportableCredential & {
            filename: string;
        })[];
        varMissingInLocal: Variables[];
        varMissingInRemote: Variables[];
        varModifiedInEither: Variables[];
        tagsMissingInLocal: TagEntity[];
        tagsMissingInRemote: TagEntity[];
        tagsModifiedInEither: TagEntity[];
        mappingsMissingInLocal: import("../../databases/entities/workflow-tag-mapping").WorkflowTagMapping[];
        mappingsMissingInRemote: import("../../databases/entities/workflow-tag-mapping").WorkflowTagMapping[];
        sourceControlledFiles: SourceControlledFile[];
    }>;
    private getStatusWorkflows;
    private getStatusCredentials;
    private getStatusVariables;
    private getStatusTagsMappings;
    setGitUserDetails(name?: string, email?: string): Promise<void>;
}
