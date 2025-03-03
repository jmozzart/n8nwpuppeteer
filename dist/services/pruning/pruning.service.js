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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PruningService = void 0;
const config_1 = require("@n8n/config");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const node_assert_1 = require("node:assert");
const typedi_1 = require("typedi");
const constants_1 = require("../../constants");
const execution_repository_1 = require("../../databases/repositories/execution.repository");
const db_1 = require("../../db");
const on_shutdown_1 = require("../../decorators/on-shutdown");
const logger_service_1 = require("../../logging/logger.service");
const orchestration_service_1 = require("../orchestration.service");
let PruningService = class PruningService {
    constructor(logger, instanceSettings, executionRepository, binaryDataService, orchestrationService, executionsConfig) {
        this.logger = logger;
        this.instanceSettings = instanceSettings;
        this.executionRepository = executionRepository;
        this.binaryDataService = binaryDataService;
        this.orchestrationService = orchestrationService;
        this.executionsConfig = executionsConfig;
        this.rates = {
            softDeletion: this.executionsConfig.pruneDataIntervals.softDelete * constants_1.Time.minutes.toMilliseconds,
            hardDeletion: this.executionsConfig.pruneDataIntervals.hardDelete * constants_1.Time.minutes.toMilliseconds,
        };
        this.batchSize = 100;
        this.isShuttingDown = false;
        this.logger = this.logger.scoped('pruning');
    }
    init() {
        (0, node_assert_1.strict)(this.instanceSettings.instanceRole !== 'unset', 'Instance role is not set');
        if (this.instanceSettings.isLeader)
            this.startPruning();
        if (this.orchestrationService.isMultiMainSetupEnabled) {
            this.orchestrationService.multiMainSetup.on('leader-takeover', () => this.startPruning());
            this.orchestrationService.multiMainSetup.on('leader-stepdown', () => this.stopPruning());
        }
    }
    get isEnabled() {
        return (this.executionsConfig.pruneData &&
            this.instanceSettings.instanceType === 'main' &&
            this.instanceSettings.isLeader);
    }
    startPruning() {
        if (!this.isEnabled || !db_1.connectionState.migrated || this.isShuttingDown)
            return;
        this.scheduleRollingSoftDeletions();
        this.scheduleNextHardDeletion();
    }
    stopPruning() {
        if (!this.isEnabled)
            return;
        clearInterval(this.softDeletionInterval);
        clearTimeout(this.hardDeletionTimeout);
    }
    scheduleRollingSoftDeletions(rateMs = this.rates.softDeletion) {
        this.softDeletionInterval = setInterval(async () => await this.softDelete(), this.rates.softDeletion);
        this.logger.debug(`Soft-deletion every ${rateMs * constants_1.Time.milliseconds.toMinutes} minutes`);
    }
    scheduleNextHardDeletion(rateMs = this.rates.hardDeletion) {
        this.hardDeletionTimeout = setTimeout(() => {
            this.hardDelete()
                .then((rate) => this.scheduleNextHardDeletion(rate))
                .catch((error) => {
                this.scheduleNextHardDeletion(1_000);
                this.logger.error('Failed to hard-delete executions', { error: (0, n8n_workflow_1.ensureError)(error) });
            });
        }, rateMs);
        this.logger.debug(`Hard-deletion in next ${rateMs * constants_1.Time.milliseconds.toMinutes} minutes`);
    }
    async softDelete() {
        const result = await this.executionRepository.softDeletePrunableExecutions();
        if (result.affected === 0) {
            this.logger.debug('Found no executions to soft-delete');
            return;
        }
        this.logger.debug('Soft-deleted executions', { count: result.affected });
    }
    shutdown() {
        this.isShuttingDown = true;
        this.stopPruning();
    }
    async hardDelete() {
        const ids = await this.executionRepository.findSoftDeletedExecutions();
        const executionIds = ids.map((o) => o.executionId);
        if (executionIds.length === 0) {
            this.logger.debug('Found no executions to hard-delete');
            return this.rates.hardDeletion;
        }
        try {
            await this.binaryDataService.deleteMany(ids);
            await this.executionRepository.deleteByIds(executionIds);
            this.logger.debug('Hard-deleted executions', { executionIds });
        }
        catch (error) {
            this.logger.error('Failed to hard-delete executions', {
                executionIds,
                error: (0, n8n_workflow_1.ensureError)(error),
            });
        }
        if (executionIds.length >= this.batchSize)
            return 1 * constants_1.Time.seconds.toMilliseconds;
        return this.rates.hardDeletion;
    }
};
exports.PruningService = PruningService;
__decorate([
    (0, on_shutdown_1.OnShutdown)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PruningService.prototype, "shutdown", null);
exports.PruningService = PruningService = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [logger_service_1.Logger,
        n8n_core_1.InstanceSettings,
        execution_repository_1.ExecutionRepository,
        n8n_core_1.BinaryDataService,
        orchestration_service_1.OrchestrationService,
        config_1.ExecutionsConfig])
], PruningService);
//# sourceMappingURL=pruning.service.js.map