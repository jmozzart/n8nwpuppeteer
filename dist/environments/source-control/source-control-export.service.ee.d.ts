import { InstanceSettings } from 'n8n-core';
import { TagRepository } from '../../databases/repositories/tag.repository';
import { Logger } from '../../logging/logger.service';
import type { ExportResult } from './types/export-result';
import type { SourceControlledFile } from './types/source-controlled-file';
import { VariablesService } from '../variables/variables.service.ee';
export declare class SourceControlExportService {
    private readonly logger;
    private readonly variablesService;
    private readonly tagRepository;
    private gitFolder;
    private workflowExportFolder;
    private credentialExportFolder;
    constructor(logger: Logger, variablesService: VariablesService, tagRepository: TagRepository, instanceSettings: InstanceSettings);
    getWorkflowPath(workflowId: string): string;
    getCredentialsPath(credentialsId: string): string;
    deleteRepositoryFolder(): Promise<void>;
    rmFilesFromExportFolder(filesToBeDeleted: Set<string>): Set<string>;
    private writeExportableWorkflowsToExportFolder;
    exportWorkflowsToWorkFolder(candidates: SourceControlledFile[]): Promise<ExportResult>;
    exportVariablesToWorkFolder(): Promise<ExportResult>;
    exportTagsToWorkFolder(): Promise<ExportResult>;
    private replaceCredentialData;
    exportCredentialsToWorkFolder(candidates: SourceControlledFile[]): Promise<ExportResult>;
}
