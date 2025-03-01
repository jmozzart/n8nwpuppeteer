import type { IRunExecutionData, ITaskData, IWorkflowBase } from 'n8n-workflow';
export declare function saveExecutionProgress(workflowData: IWorkflowBase, executionId: string, nodeName: string, data: ITaskData, executionData: IRunExecutionData, pushRef?: string): Promise<void>;
