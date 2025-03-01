import type { IDataObject, INode, IRun, ITaskData, NodeApiError, WorkflowExecuteMode, WorkflowOperationError, Workflow, NodeOperationError, IWorkflowExecutionDataProcess } from 'n8n-workflow';
import type { WorkflowEntity } from './databases/entities/workflow-entity';
export declare function generateFailedExecutionFromError(mode: WorkflowExecuteMode, error: NodeApiError | NodeOperationError | WorkflowOperationError, node: INode): IRun;
export declare function getDataLastExecutedNodeData(inputData: IRun): ITaskData | undefined;
export declare function addNodeIds(workflow: WorkflowEntity): void;
export declare function replaceInvalidCredentials(workflow: WorkflowEntity): Promise<WorkflowEntity>;
export declare function getExecutionStartNode(data: IWorkflowExecutionDataProcess, workflow: Workflow): INode | undefined;
export declare function getVariables(): Promise<IDataObject>;
