export declare class SourceControlPullWorkFolder {
    force?: boolean;
    importAfterPull?: boolean;
    files?: Set<string>;
    variables?: {
        [key: string]: string;
    };
}
export declare class SourceControllPullOptions {
    userId: string;
    force?: boolean;
    variables?: {
        [key: string]: string;
    };
}
