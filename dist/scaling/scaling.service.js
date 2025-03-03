"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScalingService = void 0;
const config_1 = require("@n8n/config");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const node_assert_1 = require("node:assert");
const typedi_1 = __importStar(require("typedi"));
const active_executions_1 = require("../active-executions");
const config_2 = __importDefault(require("../config"));
const constants_1 = require("../constants");
const execution_repository_1 = require("../databases/repositories/execution.repository");
const on_shutdown_1 = require("../decorators/on-shutdown");
const max_stalled_count_error_1 = require("../errors/max-stalled-count.error");
const event_service_1 = require("../events/event.service");
const logger_service_1 = require("../logging/logger.service");
const orchestration_service_1 = require("../services/orchestration.service");
const utils_1 = require("../utils");
const constants_2 = require("./constants");
const job_processor_1 = require("./job-processor");
let ScalingService = class ScalingService {
    constructor(logger, activeExecutions, jobProcessor, globalConfig, executionRepository, instanceSettings, orchestrationService, eventService) {
        this.logger = logger;
        this.activeExecutions = activeExecutions;
        this.jobProcessor = jobProcessor;
        this.globalConfig = globalConfig;
        this.executionRepository = executionRepository;
        this.instanceSettings = instanceSettings;
        this.orchestrationService = orchestrationService;
        this.eventService = eventService;
        this.jobCounters = { completed: 0, failed: 0 };
        this.queueRecoveryContext = {
            batchSize: config_2.default.getEnv('executions.queueRecovery.batchSize'),
            waitMs: config_2.default.getEnv('executions.queueRecovery.interval') * 60 * 1000,
        };
        this.logger = this.logger.scoped('scaling');
    }
    async setupQueue() {
        const { default: BullQueue } = await Promise.resolve().then(() => __importStar(require('bull')));
        const { RedisClientService } = await Promise.resolve().then(() => __importStar(require('../services/redis-client.service')));
        const service = typedi_1.default.get(RedisClientService);
        const bullPrefix = this.globalConfig.queue.bull.prefix;
        const prefix = service.toValidPrefix(bullPrefix);
        this.queue = new BullQueue(constants_2.QUEUE_NAME, {
            prefix,
            settings: this.globalConfig.queue.bull.settings,
            createClient: (type) => service.createClient({ type: `${type}(bull)` }),
        });
        this.registerListeners();
        if (this.instanceSettings.isLeader)
            this.scheduleQueueRecovery();
        if (this.orchestrationService.isMultiMainSetupEnabled) {
            this.orchestrationService.multiMainSetup
                .on('leader-takeover', () => this.scheduleQueueRecovery())
                .on('leader-stepdown', () => this.stopQueueRecovery());
        }
        this.scheduleQueueMetrics();
        this.logger.debug('Queue setup completed');
    }
    setupWorker(concurrency) {
        this.assertWorker();
        this.assertQueue();
        void this.queue.process(constants_2.JOB_TYPE_NAME, concurrency, async (job) => {
            try {
                await this.jobProcessor.processJob(job);
            }
            catch (error) {
                await this.reportJobProcessingError((0, n8n_workflow_1.ensureError)(error), job);
            }
        });
        this.logger.debug('Worker setup completed');
    }
    async reportJobProcessingError(error, job) {
        const { executionId } = job.data;
        this.logger.error(`Worker errored while running execution ${executionId} (job ${job.id})`, {
            error,
            executionId,
            jobId: job.id,
        });
        const msg = {
            kind: 'job-failed',
            executionId,
            workerId: this.instanceSettings.hostId,
            errorMsg: error.message,
            errorStack: error.stack ?? '',
        };
        await job.progress(msg);
        n8n_workflow_1.ErrorReporterProxy.error(error, { executionId });
        throw error;
    }
    async stop() {
        const { instanceType } = this.instanceSettings;
        if (instanceType === 'main')
            await this.stopMain();
        else if (instanceType === 'worker')
            await this.stopWorker();
    }
    async stopMain() {
        if (this.orchestrationService.isSingleMainSetup) {
            await this.queue.pause(true, true);
            this.logger.debug('Queue paused');
        }
        if (this.queueRecoveryContext.timeout)
            this.stopQueueRecovery();
        if (this.isQueueMetricsEnabled)
            this.stopQueueMetrics();
    }
    async stopWorker() {
        let count = 0;
        while (this.getRunningJobsCount() !== 0) {
            if (count++ % 4 === 0) {
                this.logger.info(`Waiting for ${this.getRunningJobsCount()} active executions to finish...`);
            }
            await (0, n8n_workflow_1.sleep)(500);
        }
    }
    async pingQueue() {
        await this.queue.client.ping();
    }
    async getPendingJobCounts() {
        const { active, waiting } = await this.queue.getJobCounts();
        return { active, waiting };
    }
    async addJob(jobData, { priority }) {
        (0, node_assert_1.strict)(priority > 0 && priority <= Number.MAX_SAFE_INTEGER);
        const jobOptions = {
            priority,
            removeOnComplete: true,
            removeOnFail: true,
        };
        const job = await this.queue.add(constants_2.JOB_TYPE_NAME, jobData, jobOptions);
        const { executionId } = jobData;
        const jobId = job.id;
        this.logger.info(`Enqueued execution ${executionId} (job ${jobId})`, { executionId, jobId });
        return job;
    }
    async getJob(jobId) {
        return await this.queue.getJob(jobId);
    }
    async findJobsByStatus(statuses) {
        const jobs = await this.queue.getJobs(statuses);
        return jobs.filter((job) => job !== null);
    }
    async stopJob(job) {
        const props = { jobId: job.id, executionId: job.data.executionId };
        try {
            if (await job.isActive()) {
                await job.progress({ kind: 'abort-job' });
                this.logger.debug('Stopped active job', props);
                return true;
            }
            await job.remove();
            this.logger.debug('Stopped inactive job', props);
            return true;
        }
        catch (error) {
            await job.progress({ kind: 'abort-job' });
            this.logger.error('Failed to stop job', { ...props, error });
            return false;
        }
    }
    getRunningJobsCount() {
        return this.jobProcessor.getRunningJobIds().length;
    }
    registerListeners() {
        const { instanceType } = this.instanceSettings;
        if (instanceType === 'main' || instanceType === 'webhook') {
            this.registerMainOrWebhookListeners();
        }
        else if (instanceType === 'worker') {
            this.registerWorkerListeners();
        }
    }
    registerWorkerListeners() {
        this.queue.on('global:progress', (jobId, msg) => {
            if (!this.isJobMessage(msg))
                return;
            if (msg.kind === 'abort-job')
                this.jobProcessor.stopJob(jobId);
        });
        this.queue.on('error', (error) => {
            if ('code' in error && error.code === 'ECONNREFUSED')
                return;
            if (error.message.includes('job stalled more than maxStalledCount')) {
                throw new max_stalled_count_error_1.MaxStalledCountError(error);
            }
            if (error.message.includes('Error initializing Lua scripts')) {
                this.logger.error('Fatal error initializing worker', { error });
                this.logger.error('Exiting process...');
                process.exit(1);
            }
            this.logger.error('Queue errored', { error });
            throw error;
        });
    }
    registerMainOrWebhookListeners() {
        this.queue.on('error', (error) => {
            if ('code' in error && error.code === 'ECONNREFUSED')
                return;
            this.logger.error('Queue errored', { error });
            throw error;
        });
        this.queue.on('global:progress', (jobId, msg) => {
            if (!this.isJobMessage(msg))
                return;
            switch (msg.kind) {
                case 'respond-to-webhook':
                    const decodedResponse = this.decodeWebhookResponse(msg.response);
                    this.activeExecutions.resolveResponsePromise(msg.executionId, decodedResponse);
                    break;
                case 'job-finished':
                    this.logger.info(`Execution ${msg.executionId} (job ${jobId}) finished successfully`, {
                        workerId: msg.workerId,
                        executionId: msg.executionId,
                        jobId,
                    });
                    break;
                case 'job-failed':
                    this.logger.error([
                        `Execution ${msg.executionId} (job ${jobId}) failed`,
                        msg.errorStack ? `\n${msg.errorStack}\n` : '',
                    ].join(''), {
                        workerId: msg.workerId,
                        errorMsg: msg.errorMsg,
                        executionId: msg.executionId,
                        jobId,
                    });
                    break;
                case 'abort-job':
                    break;
                default:
                    (0, utils_1.assertNever)(msg);
            }
        });
        if (this.isQueueMetricsEnabled) {
            this.queue.on('global:completed', () => this.jobCounters.completed++);
            this.queue.on('global:failed', () => this.jobCounters.failed++);
        }
    }
    isJobMessage(candidate) {
        return typeof candidate === 'object' && candidate !== null && 'kind' in candidate;
    }
    decodeWebhookResponse(response) {
        if (typeof response === 'object' &&
            typeof response.body === 'object' &&
            response.body !== null &&
            '__@N8nEncodedBuffer@__' in response.body &&
            typeof response.body['__@N8nEncodedBuffer@__'] === 'string') {
            response.body = Buffer.from(response.body['__@N8nEncodedBuffer@__'], n8n_workflow_1.BINARY_ENCODING);
        }
        return response;
    }
    assertQueue() {
        if (this.queue)
            return;
        throw new n8n_workflow_1.ApplicationError('This method must be called after `setupQueue`');
    }
    assertWorker() {
        if (this.instanceSettings.instanceType === 'worker')
            return;
        throw new n8n_workflow_1.ApplicationError('This method must be called on a `worker` instance');
    }
    get isQueueMetricsEnabled() {
        return (this.globalConfig.endpoints.metrics.includeQueueMetrics &&
            this.instanceSettings.instanceType === 'main' &&
            !this.orchestrationService.isMultiMainSetupEnabled);
    }
    scheduleQueueMetrics() {
        if (!this.isQueueMetricsEnabled || this.queueMetricsInterval)
            return;
        this.queueMetricsInterval = setInterval(async () => {
            const pendingJobCounts = await this.getPendingJobCounts();
            this.eventService.emit('job-counts-updated', {
                ...pendingJobCounts,
                ...this.jobCounters,
            });
            this.jobCounters.completed = 0;
            this.jobCounters.failed = 0;
        }, this.globalConfig.endpoints.metrics.queueMetricsInterval * constants_1.Time.seconds.toMilliseconds);
    }
    stopQueueMetrics() {
        if (this.queueMetricsInterval) {
            clearInterval(this.queueMetricsInterval);
            this.queueMetricsInterval = undefined;
            this.logger.debug('Queue metrics collection stopped');
        }
    }
    scheduleQueueRecovery(waitMs = this.queueRecoveryContext.waitMs) {
        this.queueRecoveryContext.timeout = setTimeout(async () => {
            try {
                const nextWaitMs = await this.recoverFromQueue();
                this.scheduleQueueRecovery(nextWaitMs);
            }
            catch (error) {
                this.logger.error('Failed to recover dangling executions from queue', {
                    msg: this.toErrorMsg(error),
                });
                this.logger.error('Retrying...');
                this.scheduleQueueRecovery();
            }
        }, waitMs);
        const wait = [this.queueRecoveryContext.waitMs / constants_1.Time.minutes.toMilliseconds, 'min'].join(' ');
        this.logger.debug(`Scheduled queue recovery check for next ${wait}`);
    }
    stopQueueRecovery() {
        clearTimeout(this.queueRecoveryContext.timeout);
        this.logger.debug('Queue recovery stopped');
    }
    async recoverFromQueue() {
        const { waitMs, batchSize } = this.queueRecoveryContext;
        const storedIds = await this.executionRepository.getInProgressExecutionIds(batchSize);
        if (storedIds.length === 0) {
            this.logger.debug('Completed queue recovery check, no dangling executions');
            return waitMs;
        }
        const runningJobs = await this.findJobsByStatus(['active', 'waiting']);
        const queuedIds = new Set(runningJobs.map((job) => job.data.executionId));
        if (queuedIds.size === 0) {
            this.logger.debug('Completed queue recovery check, no dangling executions');
            return waitMs;
        }
        const danglingIds = storedIds.filter((id) => !queuedIds.has(id));
        if (danglingIds.length === 0) {
            this.logger.debug('Completed queue recovery check, no dangling executions');
            return waitMs;
        }
        await this.executionRepository.markAsCrashed(danglingIds);
        this.logger.info('Completed queue recovery check, recovered dangling executions', {
            danglingIds,
        });
        return storedIds.length >= this.queueRecoveryContext.batchSize ? waitMs / 2 : waitMs;
    }
    toErrorMsg(error) {
        return error instanceof Error
            ? error.message
            : (0, n8n_workflow_1.jsonStringify)(error, { replaceCircularRefs: true });
    }
};
exports.ScalingService = ScalingService;
__decorate([
    (0, on_shutdown_1.OnShutdown)(constants_1.HIGHEST_SHUTDOWN_PRIORITY),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ScalingService.prototype, "stop", null);
exports.ScalingService = ScalingService = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [logger_service_1.Logger,
        active_executions_1.ActiveExecutions,
        job_processor_1.JobProcessor,
        config_1.GlobalConfig,
        execution_repository_1.ExecutionRepository,
        n8n_core_1.InstanceSettings,
        orchestration_service_1.OrchestrationService,
        event_service_1.EventService])
], ScalingService);
//# sourceMappingURL=scaling.service.js.map