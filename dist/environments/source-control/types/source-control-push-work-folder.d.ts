import type { SourceControlledFile } from './source-controlled-file';
export declare class SourceControlPushWorkFolder {
    force?: boolean;
    fileNames: SourceControlledFile[];
    message?: string;
    skipDiff?: boolean;
}
