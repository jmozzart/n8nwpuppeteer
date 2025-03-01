import { GlobalConfig } from '@n8n/config';
import type { ExecutionError, INode, WorkflowExecuteMode } from 'n8n-workflow';
import { Workflow } from 'n8n-workflow';
import { ActiveExecutions } from '../active-executions';
import { ConcurrencyControlService } from '../concurrency/concurrency-control.service';
import type { User } from '../databases/entities/user';
import { AnnotationTagMappingRepository } from '../databases/repositories/annotation-tag-mapping.repository.ee';
import { ExecutionAnnotationRepository } from '../databases/repositories/execution-annotation.repository';
import { ExecutionRepository } from '../databases/repositories/execution.repository';
import { WorkflowRepository } from '../databases/repositories/workflow.repository';
import type { IExecutionFlattedResponse, IExecutionResponse, IWorkflowDb } from '../interfaces';
import { License } from '../license';
import { Logger } from '../logging/logger.service';
import { NodeTypes } from '../node-types';
import { WaitTracker } from '../wait-tracker';
import { WorkflowRunner } from '../workflow-runner';
import { WorkflowSharingService } from '../workflows/workflow-sharing.service';
import type { ExecutionRequest, ExecutionSummaries, StopResult } from './execution.types';
export declare const schemaGetExecutionsQueryFilter: {
    $id: string;
    type: string;
    properties: {
        id: {
            type: string;
        };
        finished: {
            type: string;
        };
        mode: {
            type: string;
        };
        retryOf: {
            type: string;
        };
        retrySuccessId: {
            type: string;
        };
        status: {
            type: string;
            items: {
                type: string;
            };
        };
        waitTill: {
            type: string;
        };
        workflowId: {
            anyOf: {
                type: string;
            }[];
        };
        metadata: {
            type: string;
            items: {
                $ref: string;
            };
        };
        startedAfter: {
            type: string;
        };
        startedBefore: {
            type: string;
        };
        annotationTags: {
            type: string;
            items: {
                type: string;
            };
        };
        vote: {
            type: string;
        };
        projectId: {
            type: string;
        };
    };
    $defs: {
        metadata: {
            type: string;
            required: string[];
            properties: {
                key: {
                    type: string;
                };
                value: {
                    type: string;
                };
            };
        };
    };
};
export declare const allowedExecutionsQueryFilterFields: string[];
export declare class ExecutionService {
    private readonly globalConfig;
    private readonly logger;
    private readonly activeExecutions;
    private readonly executionAnnotationRepository;
    private readonly annotationTagMappingRepository;
    private readonly executionRepository;
    private readonly workflowRepository;
    private readonly nodeTypes;
    private readonly waitTracker;
    private readonly workflowRunner;
    private readonly concurrencyControl;
    private readonly license;
    private readonly workflowSharingService;
    constructor(globalConfig: GlobalConfig, logger: Logger, activeExecutions: ActiveExecutions, executionAnnotationRepository: ExecutionAnnotationRepository, annotationTagMappingRepository: AnnotationTagMappingRepository, executionRepository: ExecutionRepository, workflowRepository: WorkflowRepository, nodeTypes: NodeTypes, waitTracker: WaitTracker, workflowRunner: WorkflowRunner, concurrencyControl: ConcurrencyControlService, license: License, workflowSharingService: WorkflowSharingService);
    findOne(req: ExecutionRequest.GetOne | ExecutionRequest.Update, sharedWorkflowIds: string[]): Promise<IExecutionResponse | IExecutionFlattedResponse | undefined>;
    retry(req: ExecutionRequest.Retry, sharedWorkflowIds: string[]): Promise<boolean>;
    delete(req: ExecutionRequest.Delete, sharedWorkflowIds: string[]): Promise<void>;
    createErrorExecution(error: ExecutionError, node: INode, workflowData: IWorkflowDb, workflow: Workflow, mode: WorkflowExecuteMode): Promise<void>;
    findRangeWithCount(query: ExecutionSummaries.RangeQuery): Promise<{
        count: number;
        estimated: boolean;
        results: import("n8n-workflow").ExecutionSummary[];
    }>;
    findLatestCurrentAndCompleted(query: ExecutionSummaries.RangeQuery): Promise<{
        results: import("n8n-workflow").ExecutionSummary[];
        count: number;
        estimated: boolean;
    }>;
    findAllEnqueuedExecutions(): Promise<IExecutionResponse[]>;
    stop(executionId: string): Promise<StopResult>;
    private assertStoppable;
    private stopInRegularMode;
    private stopInScalingMode;
    addScopes(user: User, summaries: ExecutionSummaries.ExecutionSummaryWithScopes[]): Promise<void>;
    annotate(executionId: string, updateData: ExecutionRequest.ExecutionUpdatePayload, sharedWorkflowIds: string[]): Promise<void>;
}
