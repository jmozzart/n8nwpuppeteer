import type { KeyPairType } from './types/key-pair-type';
import type { SourceControlledFile } from './types/source-controlled-file';
export declare function stringContainsExpression(testString: string): boolean;
export declare function getWorkflowExportPath(workflowId: string, workflowExportFolder: string): string;
export declare function getCredentialExportPath(credentialId: string, credentialExportFolder: string): string;
export declare function getVariablesPath(gitFolder: string): string;
export declare function getTagsPath(gitFolder: string): string;
export declare function sourceControlFoldersExistCheck(folders: string[], createIfNotExists?: boolean): boolean;
export declare function isSourceControlLicensed(): boolean;
export declare function generateSshKeyPair(keyType: KeyPairType): Promise<{
    privateKey: string;
    publicKey: string;
}>;
export declare function getRepoType(repoUrl: string): 'github' | 'gitlab' | 'other';
export declare function getTrackingInformationFromPullResult(result: SourceControlledFile[]): {
    credConflicts: number;
    workflowConflicts: number;
    workflowUpdates: number;
};
export declare function getTrackingInformationFromPrePushResult(result: SourceControlledFile[]): {
    workflowsEligible: number;
    workflowsEligibleWithConflicts: number;
    credsEligible: number;
    credsEligibleWithConflicts: number;
    variablesEligible: number;
};
export declare function getTrackingInformationFromPostPushResult(result: SourceControlledFile[]): {
    workflowsPushed: number;
    workflowsEligible: number;
    credsPushed: number;
    variablesPushed: number;
};
export declare function normalizeAndValidateSourceControlledFilePath(gitFolderPath: string, filePath: string): string;
