import type { RunningJobSummary } from '@n8n/api-types';
import { InstanceSettings } from 'n8n-core';
import { ExecutionRepository } from '../databases/repositories/execution.repository';
import { WorkflowRepository } from '../databases/repositories/workflow.repository';
import { Logger } from '../logging/logger.service';
import { NodeTypes } from '../node-types';
import type { Job, JobId, JobResult } from './scaling.types';
export declare class JobProcessor {
    private readonly logger;
    private readonly executionRepository;
    private readonly workflowRepository;
    private readonly nodeTypes;
    private readonly instanceSettings;
    private readonly runningJobs;
    constructor(logger: Logger, executionRepository: ExecutionRepository, workflowRepository: WorkflowRepository, nodeTypes: NodeTypes, instanceSettings: InstanceSettings);
    processJob(job: Job): Promise<JobResult>;
    stopJob(jobId: JobId): void;
    getRunningJobIds(): JobId[];
    getRunningJobsSummary(): RunningJobSummary[];
    private encodeWebhookResponse;
}
