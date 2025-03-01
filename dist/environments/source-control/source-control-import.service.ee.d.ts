import { InstanceSettings } from 'n8n-core';
import { ActiveWorkflowManager } from '../../active-workflow-manager';
import type { TagEntity } from '../../databases/entities/tag-entity';
import type { Variables } from '../../databases/entities/variables';
import type { WorkflowTagMapping } from '../../databases/entities/workflow-tag-mapping';
import { TagRepository } from '../../databases/repositories/tag.repository';
import { Logger } from '../../logging/logger.service';
import type { ExportableCredential } from './types/exportable-credential';
import type { SourceControlWorkflowVersionId } from './types/source-control-workflow-version-id';
import type { SourceControlledFile } from './types/source-controlled-file';
import { VariablesService } from '../variables/variables.service.ee';
export declare class SourceControlImportService {
    private readonly logger;
    private readonly variablesService;
    private readonly activeWorkflowManager;
    private readonly tagRepository;
    private gitFolder;
    private workflowExportFolder;
    private credentialExportFolder;
    constructor(logger: Logger, variablesService: VariablesService, activeWorkflowManager: ActiveWorkflowManager, tagRepository: TagRepository, instanceSettings: InstanceSettings);
    getRemoteVersionIdsFromFiles(): Promise<SourceControlWorkflowVersionId[]>;
    getLocalVersionIdsFromDb(): Promise<SourceControlWorkflowVersionId[]>;
    getRemoteCredentialsFromFiles(): Promise<Array<ExportableCredential & {
        filename: string;
    }>>;
    getLocalCredentialsFromDb(): Promise<Array<ExportableCredential & {
        filename: string;
    }>>;
    getRemoteVariablesFromFile(): Promise<Variables[]>;
    getLocalVariablesFromDb(): Promise<Variables[]>;
    getRemoteTagsAndMappingsFromFile(): Promise<{
        tags: TagEntity[];
        mappings: WorkflowTagMapping[];
    }>;
    getLocalTagsAndMappingsFromDb(): Promise<{
        tags: TagEntity[];
        mappings: WorkflowTagMapping[];
    }>;
    importWorkflowFromWorkFolder(candidates: SourceControlledFile[], userId: string): Promise<{
        id: string;
        name: string;
    }[]>;
    importCredentialsFromWorkFolder(candidates: SourceControlledFile[], userId: string): Promise<{
        id: string;
        name: string;
        type: string;
    }[]>;
    importTagsFromWorkFolder(candidate: SourceControlledFile): Promise<{
        tags: TagEntity[];
        mappings: WorkflowTagMapping[];
    } | undefined>;
    importVariablesFromWorkFolder(candidate: SourceControlledFile, valueOverrides?: {
        [key: string]: string;
    }): Promise<{
        imported: string[];
    } | undefined>;
    private findOrCreateOwnerProject;
}
