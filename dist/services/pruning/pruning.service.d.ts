import { ExecutionsConfig } from '@n8n/config';
import { BinaryDataService, InstanceSettings } from 'n8n-core';
import { ExecutionRepository } from '../../databases/repositories/execution.repository';
import { Logger } from '../../logging/logger.service';
import { OrchestrationService } from '../orchestration.service';
export declare class PruningService {
    private readonly logger;
    private readonly instanceSettings;
    private readonly executionRepository;
    private readonly binaryDataService;
    private readonly orchestrationService;
    private readonly executionsConfig;
    private softDeletionInterval;
    private hardDeletionTimeout;
    private readonly rates;
    private readonly batchSize;
    private isShuttingDown;
    constructor(logger: Logger, instanceSettings: InstanceSettings, executionRepository: ExecutionRepository, binaryDataService: BinaryDataService, orchestrationService: OrchestrationService, executionsConfig: ExecutionsConfig);
    init(): void;
    get isEnabled(): boolean;
    startPruning(): void;
    stopPruning(): void;
    private scheduleRollingSoftDeletions;
    private scheduleNextHardDeletion;
    softDelete(): Promise<void>;
    shutdown(): void;
    private hardDelete;
}
