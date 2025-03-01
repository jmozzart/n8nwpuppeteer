import { GlobalConfig } from '@n8n/config';
import type { IDeferredPromise, IExecuteResponsePromiseData, INode, INodeExecutionData, IPinData, IWorkflowExecuteAdditionalData, WorkflowExecuteMode } from 'n8n-workflow';
import type { Project } from '../databases/entities/project';
import type { User } from '../databases/entities/user';
import { ExecutionRepository } from '../databases/repositories/execution.repository';
import { WorkflowRepository } from '../databases/repositories/workflow.repository';
import type { IWorkflowDb, IWorkflowErrorData } from '../interfaces';
import { Logger } from '../logging/logger.service';
import { NodeTypes } from '../node-types';
import { SubworkflowPolicyChecker } from '../subworkflows/subworkflow-policy-checker.service';
import { TestWebhooks } from '../webhooks/test-webhooks';
import { WorkflowRunner } from '../workflow-runner';
import type { WorkflowRequest } from '../workflows/workflow.request';
export declare class WorkflowExecutionService {
    private readonly logger;
    private readonly executionRepository;
    private readonly workflowRepository;
    private readonly nodeTypes;
    private readonly testWebhooks;
    private readonly workflowRunner;
    private readonly globalConfig;
    private readonly subworkflowPolicyChecker;
    constructor(logger: Logger, executionRepository: ExecutionRepository, workflowRepository: WorkflowRepository, nodeTypes: NodeTypes, testWebhooks: TestWebhooks, workflowRunner: WorkflowRunner, globalConfig: GlobalConfig, subworkflowPolicyChecker: SubworkflowPolicyChecker);
    runWorkflow(workflowData: IWorkflowDb, node: INode, data: INodeExecutionData[][], additionalData: IWorkflowExecuteAdditionalData, mode: WorkflowExecuteMode, responsePromise?: IDeferredPromise<IExecuteResponsePromiseData>): Promise<string>;
    executeManually({ workflowData, runData, startNodes, destinationNode }: WorkflowRequest.ManualRunPayload, user: User, pushRef?: string, partialExecutionVersion?: string): Promise<{
        waitingForWebhook: boolean;
        executionId?: undefined;
    } | {
        executionId: string;
        waitingForWebhook?: undefined;
    }>;
    executeErrorWorkflow(workflowId: string, workflowErrorData: IWorkflowErrorData, runningProject: Project): Promise<void>;
    selectPinnedActivatorStarter(workflow: IWorkflowDb, startNodes?: string[], pinData?: IPinData): INode | null;
    private findAllPinnedActivators;
}
