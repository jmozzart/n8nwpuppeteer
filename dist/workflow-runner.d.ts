import { InstanceSettings } from 'n8n-core';
import type { ExecutionError, IDeferredPromise, IExecuteResponsePromiseData, WorkflowExecuteMode, WorkflowHooks, IWorkflowExecutionDataProcess } from 'n8n-workflow';
import { ActiveExecutions } from './active-executions';
import { ExecutionRepository } from './databases/repositories/execution.repository';
import { ExternalHooks } from './external-hooks';
import { Logger } from './logging/logger.service';
import { NodeTypes } from './node-types';
import { PermissionChecker } from './user-management/permission-checker';
import { WorkflowStaticDataService } from './workflows/workflow-static-data.service';
import { ExecutionNotFoundError } from './errors/execution-not-found-error';
import { EventService } from './events/event.service';
export declare class WorkflowRunner {
    private readonly logger;
    private readonly activeExecutions;
    private readonly executionRepository;
    private readonly externalHooks;
    private readonly workflowStaticDataService;
    private readonly nodeTypes;
    private readonly permissionChecker;
    private readonly eventService;
    private readonly instanceSettings;
    private scalingService;
    private executionsMode;
    constructor(logger: Logger, activeExecutions: ActiveExecutions, executionRepository: ExecutionRepository, externalHooks: ExternalHooks, workflowStaticDataService: WorkflowStaticDataService, nodeTypes: NodeTypes, permissionChecker: PermissionChecker, eventService: EventService, instanceSettings: InstanceSettings);
    processError(error: ExecutionError | ExecutionNotFoundError, startedAt: Date, executionMode: WorkflowExecuteMode, executionId: string, hooks?: WorkflowHooks): Promise<void>;
    run(data: IWorkflowExecutionDataProcess, loadStaticData?: boolean, realtime?: boolean, restartExecutionId?: string, responsePromise?: IDeferredPromise<IExecuteResponsePromiseData>): Promise<string>;
    private runMainProcess;
    private enqueueExecution;
}
