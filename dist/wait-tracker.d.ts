import { InstanceSettings } from 'n8n-core';
import { ExecutionRepository } from './databases/repositories/execution.repository';
import { Logger } from './logging/logger.service';
import { OrchestrationService } from './services/orchestration.service';
import { OwnershipService } from './services/ownership.service';
import { WorkflowRunner } from './workflow-runner';
export declare class WaitTracker {
    private readonly logger;
    private readonly executionRepository;
    private readonly ownershipService;
    private readonly workflowRunner;
    private readonly orchestrationService;
    private readonly instanceSettings;
    private waitingExecutions;
    mainTimer: NodeJS.Timeout;
    constructor(logger: Logger, executionRepository: ExecutionRepository, ownershipService: OwnershipService, workflowRunner: WorkflowRunner, orchestrationService: OrchestrationService, instanceSettings: InstanceSettings);
    has(executionId: string): boolean;
    init(): void;
    private startTracking;
    getWaitingExecutions(): Promise<void>;
    stopExecution(executionId: string): void;
    startExecution(executionId: string): void;
    stopTracking(): void;
}
