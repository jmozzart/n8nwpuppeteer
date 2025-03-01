"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConcurrencyControlService = exports.CLOUD_TEMP_REPORTABLE_THRESHOLDS = exports.CLOUD_TEMP_PRODUCTION_LIMIT = void 0;
const typedi_1 = require("typedi");
const config_1 = __importDefault(require("../config"));
const execution_repository_1 = require("../databases/repositories/execution.repository");
const invalid_concurrency_limit_error_1 = require("../errors/invalid-concurrency-limit.error");
const unknown_execution_mode_error_1 = require("../errors/unknown-execution-mode.error");
const event_service_1 = require("../events/event.service");
const logger_service_1 = require("../logging/logger.service");
const telemetry_1 = require("../telemetry");
const concurrency_queue_1 = require("./concurrency-queue");
exports.CLOUD_TEMP_PRODUCTION_LIMIT = 999;
exports.CLOUD_TEMP_REPORTABLE_THRESHOLDS = [5, 10, 20, 50, 100, 200];
let ConcurrencyControlService = class ConcurrencyControlService {
    constructor(logger, executionRepository, telemetry, eventService) {
        this.logger = logger;
        this.executionRepository = executionRepository;
        this.telemetry = telemetry;
        this.eventService = eventService;
        this.limitsToReport = exports.CLOUD_TEMP_REPORTABLE_THRESHOLDS.map((t) => exports.CLOUD_TEMP_PRODUCTION_LIMIT - t);
        this.logger = this.logger.scoped('concurrency');
        this.productionLimit = config_1.default.getEnv('executions.concurrency.productionLimit');
        if (this.productionLimit === 0) {
            throw new invalid_concurrency_limit_error_1.InvalidConcurrencyLimitError(this.productionLimit);
        }
        if (this.productionLimit < -1) {
            this.productionLimit = -1;
        }
        if (this.productionLimit === -1 || config_1.default.getEnv('executions.mode') === 'queue') {
            this.isEnabled = false;
            return;
        }
        this.productionQueue = new concurrency_queue_1.ConcurrencyQueue(this.productionLimit);
        this.logInit();
        this.isEnabled = true;
        this.productionQueue.on('concurrency-check', ({ capacity }) => {
            if (this.shouldReport(capacity)) {
                this.telemetry.track('User hit concurrency limit', {
                    threshold: exports.CLOUD_TEMP_PRODUCTION_LIMIT - capacity,
                });
            }
        });
        this.productionQueue.on('execution-throttled', ({ executionId }) => {
            this.logger.debug('Execution throttled', { executionId });
            this.eventService.emit('execution-throttled', { executionId });
        });
        this.productionQueue.on('execution-released', async (executionId) => {
            this.logger.debug('Execution released', { executionId });
        });
    }
    has(executionId) {
        if (!this.isEnabled)
            return false;
        return this.productionQueue.getAll().has(executionId);
    }
    async throttle({ mode, executionId }) {
        if (!this.isEnabled || this.isUnlimited(mode))
            return;
        await this.productionQueue.enqueue(executionId);
    }
    release({ mode }) {
        if (!this.isEnabled || this.isUnlimited(mode))
            return;
        this.productionQueue.dequeue();
    }
    remove({ mode, executionId }) {
        if (!this.isEnabled || this.isUnlimited(mode))
            return;
        this.productionQueue.remove(executionId);
    }
    async removeAll(activeExecutions) {
        if (!this.isEnabled)
            return;
        const enqueuedProductionIds = this.productionQueue.getAll();
        for (const id of enqueuedProductionIds) {
            this.productionQueue.remove(id);
        }
        const executionIds = Object.entries(activeExecutions)
            .filter(([_, execution]) => execution.status === 'new' && execution.responsePromise)
            .map(([executionId, _]) => executionId);
        if (executionIds.length === 0)
            return;
        await this.executionRepository.cancelMany(executionIds);
        this.logger.info('Canceled enqueued executions with response promises', { executionIds });
    }
    disable() {
        this.isEnabled = false;
    }
    logInit() {
        this.logger.debug('Enabled');
        this.logger.debug([
            'Production execution concurrency is',
            this.productionLimit === -1 ? 'unlimited' : 'limited to ' + this.productionLimit.toString(),
        ].join(' '));
    }
    isUnlimited(mode) {
        if (mode === 'error' ||
            mode === 'integrated' ||
            mode === 'cli' ||
            mode === 'internal' ||
            mode === 'manual' ||
            mode === 'retry') {
            return true;
        }
        if (mode === 'webhook' || mode === 'trigger')
            return this.productionLimit === -1;
        throw new unknown_execution_mode_error_1.UnknownExecutionModeError(mode);
    }
    shouldReport(capacity) {
        return config_1.default.getEnv('deployment.type') === 'cloud' && this.limitsToReport.includes(capacity);
    }
};
exports.ConcurrencyControlService = ConcurrencyControlService;
exports.ConcurrencyControlService = ConcurrencyControlService = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [logger_service_1.Logger,
        execution_repository_1.ExecutionRepository,
        telemetry_1.Telemetry,
        event_service_1.EventService])
], ConcurrencyControlService);
//# sourceMappingURL=concurrency-control.service.js.map