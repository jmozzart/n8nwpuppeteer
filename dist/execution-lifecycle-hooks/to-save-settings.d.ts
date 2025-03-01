import type { IWorkflowSettings } from 'n8n-workflow';
export declare function toSaveSettings(workflowSettings?: IWorkflowSettings): {
    error: boolean | "all" | "none";
    success: boolean | "all" | "none";
    manual: boolean;
    progress: boolean;
};
