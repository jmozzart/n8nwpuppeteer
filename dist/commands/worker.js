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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Worker = void 0;
const core_1 = require("@oclif/core");
const typedi_1 = require("typedi");
const config_1 = __importDefault(require("../config"));
const constants_1 = require("../constants");
const worker_missing_encryption_key_error_1 = require("../errors/worker-missing-encryption-key.error");
const event_message_generic_1 = require("../eventbus/event-message-classes/event-message-generic");
const message_event_bus_1 = require("../eventbus/message-event-bus/message-event-bus");
const log_streaming_event_relay_1 = require("../events/relays/log-streaming.event-relay");
const logger_service_1 = require("../logging/logger.service");
const pubsub_handler_1 = require("../scaling/pubsub/pubsub-handler");
const subscriber_service_1 = require("../scaling/pubsub/subscriber.service");
const orchestration_service_1 = require("../services/orchestration.service");
const base_command_1 = require("./base-command");
class Worker extends base_command_1.BaseCommand {
    async stopProcess() {
        this.logger.info('Stopping worker...');
        try {
            await this.externalHooks?.run('n8n.stop', []);
        }
        catch (error) {
            await this.exitWithCrash('Error shutting down worker', error);
        }
        await this.exitSuccessFully();
    }
    constructor(argv, cmdConfig) {
        if (!process.env.N8N_ENCRYPTION_KEY)
            throw new worker_missing_encryption_key_error_1.WorkerMissingEncryptionKey();
        if (config_1.default.getEnv('executions.mode') !== 'queue') {
            config_1.default.set('executions.mode', 'queue');
        }
        super(argv, cmdConfig);
        this.needsCommunityPackages = true;
        this.logger = typedi_1.Container.get(logger_service_1.Logger).scoped('scaling');
    }
    async init() {
        const { QUEUE_WORKER_TIMEOUT } = process.env;
        if (QUEUE_WORKER_TIMEOUT) {
            this.gracefulShutdownTimeoutInS =
                parseInt(QUEUE_WORKER_TIMEOUT, 10) || this.globalConfig.queue.bull.gracefulShutdownTimeout;
            this.logger.warn('QUEUE_WORKER_TIMEOUT has been deprecated. Rename it to N8N_GRACEFUL_SHUTDOWN_TIMEOUT.');
        }
        await this.initCrashJournal();
        this.logger.debug('Starting n8n worker...');
        this.logger.debug(`Host ID: ${this.instanceSettings.hostId}`);
        await this.setConcurrency();
        await super.init();
        await this.initLicense();
        this.logger.debug('License init complete');
        await this.initBinaryDataService();
        this.logger.debug('Binary data service init complete');
        await this.initDataDeduplicationService();
        this.logger.debug('Data deduplication service init complete');
        await this.initExternalHooks();
        this.logger.debug('External hooks init complete');
        await this.initExternalSecrets();
        this.logger.debug('External secrets init complete');
        await this.initEventBus();
        this.logger.debug('Event bus init complete');
        await this.initScalingService();
        await this.initOrchestration();
        this.logger.debug('Orchestration init complete');
        await typedi_1.Container.get(message_event_bus_1.MessageEventBus).send(new event_message_generic_1.EventMessageGeneric({
            eventName: 'n8n.worker.started',
            payload: {
                workerId: this.instanceSettings.hostId,
            },
        }));
        const { taskRunners: taskRunnerConfig } = this.globalConfig;
        if (taskRunnerConfig.enabled) {
            const { TaskRunnerModule } = await Promise.resolve().then(() => __importStar(require('../runners/task-runner-module')));
            const taskRunnerModule = typedi_1.Container.get(TaskRunnerModule);
            await taskRunnerModule.start();
        }
    }
    async initEventBus() {
        await typedi_1.Container.get(message_event_bus_1.MessageEventBus).initialize({
            workerId: this.instanceSettings.hostId,
        });
        typedi_1.Container.get(log_streaming_event_relay_1.LogStreamingEventRelay).init();
    }
    async initOrchestration() {
        await typedi_1.Container.get(orchestration_service_1.OrchestrationService).init();
        typedi_1.Container.get(pubsub_handler_1.PubSubHandler).init();
        await typedi_1.Container.get(subscriber_service_1.Subscriber).subscribe('n8n.commands');
        this.logger.scoped(['scaling', 'pubsub']).debug('Pubsub setup completed');
    }
    async setConcurrency() {
        const { flags } = await this.parse(Worker);
        const envConcurrency = config_1.default.getEnv('executions.concurrency.productionLimit');
        this.concurrency = envConcurrency !== -1 ? envConcurrency : flags.concurrency;
        if (this.concurrency < 5) {
            this.logger.warn('Concurrency is set to less than 5. THIS CAN LEAD TO AN UNSTABLE ENVIRONMENT. Please consider increasing it to at least 5 to make best use of the worker.');
        }
    }
    async initScalingService() {
        const { ScalingService } = await Promise.resolve().then(() => __importStar(require('../scaling/scaling.service')));
        this.scalingService = typedi_1.Container.get(ScalingService);
        await this.scalingService.setupQueue();
        this.scalingService.setupWorker(this.concurrency);
    }
    async run() {
        this.logger.info('\nn8n worker is now ready');
        this.logger.info(` * Version: ${constants_1.N8N_VERSION}`);
        this.logger.info(` * Concurrency: ${this.concurrency}`);
        this.logger.info('');
        const endpointsConfig = {
            health: this.globalConfig.queue.health.active,
            overwrites: this.globalConfig.credentials.overwrite.endpoint !== '',
            metrics: this.globalConfig.endpoints.metrics.enable,
        };
        if (Object.values(endpointsConfig).some((e) => e)) {
            const { WorkerServer } = await Promise.resolve().then(() => __importStar(require('../scaling/worker-server')));
            await typedi_1.Container.get(WorkerServer).init(endpointsConfig);
        }
        if (!constants_1.inTest && process.stdout.isTTY) {
            process.stdin.setRawMode(true);
            process.stdin.resume();
            process.stdin.setEncoding('utf8');
            process.stdin.on('data', (key) => {
                if (key.charCodeAt(0) === 3)
                    process.kill(process.pid, 'SIGINT');
            });
        }
        if (!constants_1.inTest)
            await new Promise(() => { });
    }
    async catch(error) {
        await this.exitWithCrash('Worker exiting due to an error.', error);
    }
}
exports.Worker = Worker;
Worker.description = '\nStarts a n8n worker';
Worker.examples = ['$ n8n worker --concurrency=5'];
Worker.flags = {
    help: core_1.Flags.help({ char: 'h' }),
    concurrency: core_1.Flags.integer({
        default: 10,
        description: 'How many jobs can run in parallel.',
    }),
};
//# sourceMappingURL=worker.js.map