import { InstanceSettings } from 'n8n-core';
import { ExecutionRepository } from '../databases/repositories/execution.repository';
import { EventService } from '../events/event.service';
import type { IExecutionResponse } from '../interfaces';
import { Logger } from '../logging/logger.service';
import { Push } from '../push';
import type { EventMessageTypes } from '../eventbus/event-message-classes';
export declare class ExecutionRecoveryService {
    private readonly logger;
    private readonly instanceSettings;
    private readonly push;
    private readonly executionRepository;
    private readonly eventService;
    constructor(logger: Logger, instanceSettings: InstanceSettings, push: Push, executionRepository: ExecutionRepository, eventService: EventService);
    recoverFromLogs(executionId: string, messages: EventMessageTypes[]): Promise<IExecutionResponse | null | undefined>;
    private amend;
    private amendWithoutLogs;
    private toRelevantMessages;
    private toStoppedAt;
    private runHooks;
}
