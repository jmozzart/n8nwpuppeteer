import type { WorkflowExecuteMode as ExecutionMode } from 'n8n-workflow';
import { ExecutionRepository } from '../databases/repositories/execution.repository';
import { EventService } from '../events/event.service';
import type { IExecutingWorkflowData } from '../interfaces';
import { Logger } from '../logging/logger.service';
import { Telemetry } from '../telemetry';
export declare const CLOUD_TEMP_PRODUCTION_LIMIT = 999;
export declare const CLOUD_TEMP_REPORTABLE_THRESHOLDS: number[];
export declare class ConcurrencyControlService {
    private readonly logger;
    private readonly executionRepository;
    private readonly telemetry;
    private readonly eventService;
    private isEnabled;
    private readonly productionLimit;
    private readonly productionQueue;
    private readonly limitsToReport;
    constructor(logger: Logger, executionRepository: ExecutionRepository, telemetry: Telemetry, eventService: EventService);
    has(executionId: string): boolean;
    throttle({ mode, executionId }: {
        mode: ExecutionMode;
        executionId: string;
    }): Promise<void>;
    release({ mode }: {
        mode: ExecutionMode;
    }): void;
    remove({ mode, executionId }: {
        mode: ExecutionMode;
        executionId: string;
    }): void;
    removeAll(activeExecutions: {
        [executionId: string]: IExecutingWorkflowData;
    }): Promise<void>;
    disable(): void;
    private logInit;
    private isUnlimited;
    private shouldReport;
}
