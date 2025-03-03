import express from 'express';
import type { PullResult } from 'simple-git';
import { EventService } from '../../events/event.service';
import { SourceControlPreferencesService } from './source-control-preferences.service.ee';
import { SourceControlService } from './source-control.service.ee';
import type { ImportResult } from './types/import-result';
import { SourceControlRequest } from './types/requests';
import type { SourceControlPreferences } from './types/source-control-preferences';
import type { SourceControlledFile } from './types/source-controlled-file';
export declare class SourceControlController {
    private readonly sourceControlService;
    private readonly sourceControlPreferencesService;
    private readonly eventService;
    constructor(sourceControlService: SourceControlService, sourceControlPreferencesService: SourceControlPreferencesService, eventService: EventService);
    getPreferences(): Promise<SourceControlPreferences>;
    setPreferences(req: SourceControlRequest.UpdatePreferences): Promise<SourceControlPreferences>;
    updatePreferences(req: SourceControlRequest.UpdatePreferences): Promise<SourceControlPreferences>;
    disconnect(req: SourceControlRequest.Disconnect): Promise<SourceControlPreferences>;
    getBranches(): Promise<{
        branches: string[];
        currentBranch: string;
    }>;
    pushWorkfolder(req: SourceControlRequest.PushWorkFolder, res: express.Response): Promise<SourceControlledFile[]>;
    pullWorkfolder(req: SourceControlRequest.PullWorkFolder, res: express.Response): Promise<SourceControlledFile[] | ImportResult | PullResult | undefined>;
    resetWorkfolder(): Promise<ImportResult | undefined>;
    getStatus(req: SourceControlRequest.GetStatus): Promise<SourceControlledFile[]>;
    status(req: SourceControlRequest.GetStatus): Promise<SourceControlledFile[] | {
        wfRemoteVersionIds: import("./types/source-control-workflow-version-id").SourceControlWorkflowVersionId[];
        wfLocalVersionIds: import("./types/source-control-workflow-version-id").SourceControlWorkflowVersionId[];
        wfMissingInLocal: import("./types/source-control-workflow-version-id").SourceControlWorkflowVersionId[];
        wfMissingInRemote: import("./types/source-control-workflow-version-id").SourceControlWorkflowVersionId[];
        wfModifiedInEither: import("./types/source-control-workflow-version-id").SourceControlWorkflowVersionId[];
        credMissingInLocal: (import("./types/exportable-credential").ExportableCredential & {
            filename: string;
        })[];
        credMissingInRemote: (import("./types/exportable-credential").ExportableCredential & {
            filename: string;
        })[];
        credModifiedInEither: (import("./types/exportable-credential").ExportableCredential & {
            filename: string;
        })[];
        varMissingInLocal: import("../../databases/entities/variables").Variables[];
        varMissingInRemote: import("../../databases/entities/variables").Variables[];
        varModifiedInEither: import("../../databases/entities/variables").Variables[];
        tagsMissingInLocal: import("../../databases/entities/tag-entity").TagEntity[];
        tagsMissingInRemote: import("../../databases/entities/tag-entity").TagEntity[];
        tagsModifiedInEither: import("../../databases/entities/tag-entity").TagEntity[];
        mappingsMissingInLocal: import("../../databases/entities/workflow-tag-mapping").WorkflowTagMapping[];
        mappingsMissingInRemote: import("../../databases/entities/workflow-tag-mapping").WorkflowTagMapping[];
        sourceControlledFiles: SourceControlledFile[];
    }>;
    generateKeyPair(req: SourceControlRequest.GenerateKeyPair): Promise<SourceControlPreferences>;
}
