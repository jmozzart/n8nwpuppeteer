import type { IDeferredPromise, IExecuteResponsePromiseData, IRun, ExecutionStatus, IWorkflowExecutionDataProcess } from 'n8n-workflow';
import type PCancelable from 'p-cancelable';
import { ExecutionRepository } from './databases/repositories/execution.repository';
import type { IExecutionsCurrentSummary } from './interfaces';
import { Logger } from './logging/logger.service';
import { ConcurrencyControlService } from './concurrency/concurrency-control.service';
export declare class ActiveExecutions {
    private readonly logger;
    private readonly executionRepository;
    private readonly concurrencyControl;
    private activeExecutions;
    constructor(logger: Logger, executionRepository: ExecutionRepository, concurrencyControl: ConcurrencyControlService);
    has(executionId: string): boolean;
    add(executionData: IWorkflowExecutionDataProcess, executionId?: string): Promise<string>;
    attachWorkflowExecution(executionId: string, workflowExecution: PCancelable<IRun>): void;
    attachResponsePromise(executionId: string, responsePromise: IDeferredPromise<IExecuteResponsePromiseData>): void;
    resolveResponsePromise(executionId: string, response: IExecuteResponsePromiseData): void;
    stopExecution(executionId: string): void;
    finalizeExecution(executionId: string, fullRunData?: IRun): void;
    getPostExecutePromise(executionId: string): Promise<IRun | undefined>;
    getActiveExecutions(): IExecutionsCurrentSummary[];
    setStatus(executionId: string, status: ExecutionStatus): void;
    getStatus(executionId: string): ExecutionStatus;
    shutdown(cancelAll?: boolean): Promise<void>;
    private getExecution;
}
