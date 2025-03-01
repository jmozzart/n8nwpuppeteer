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
exports.ActiveExecutions = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const node_assert_1 = require("node:assert");
const typedi_1 = require("typedi");
const execution_repository_1 = require("./databases/repositories/execution.repository");
const execution_not_found_error_1 = require("./errors/execution-not-found-error");
const logger_service_1 = require("./logging/logger.service");
const utils_1 = require("./utils");
const concurrency_control_service_1 = require("./concurrency/concurrency-control.service");
const config_1 = __importDefault(require("./config"));
let ActiveExecutions = class ActiveExecutions {
    constructor(logger, executionRepository, concurrencyControl) {
        this.logger = logger;
        this.executionRepository = executionRepository;
        this.concurrencyControl = concurrencyControl;
        this.activeExecutions = {};
    }
    has(executionId) {
        return this.activeExecutions[executionId] !== undefined;
    }
    async add(executionData, executionId) {
        let executionStatus = executionId ? 'running' : 'new';
        const mode = executionData.executionMode;
        if (executionId === undefined) {
            const fullExecutionData = {
                data: executionData.executionData,
                mode,
                finished: false,
                workflowData: executionData.workflowData,
                status: executionStatus,
                workflowId: executionData.workflowData.id,
            };
            if (executionData.retryOf !== undefined) {
                fullExecutionData.retryOf = executionData.retryOf.toString();
            }
            const workflowId = executionData.workflowData.id;
            if (workflowId !== undefined && (0, utils_1.isWorkflowIdValid)(workflowId)) {
                fullExecutionData.workflowId = workflowId;
            }
            executionId = await this.executionRepository.createNewExecution(fullExecutionData);
            (0, node_assert_1.strict)(executionId);
            if (config_1.default.getEnv('executions.mode') === 'regular') {
                await this.concurrencyControl.throttle({ mode, executionId });
                await this.executionRepository.setRunning(executionId);
            }
            executionStatus = 'running';
        }
        else {
            await this.concurrencyControl.throttle({ mode, executionId });
            const execution = {
                id: executionId,
                data: executionData.executionData,
                waitTill: null,
                status: executionStatus,
            };
            await this.executionRepository.updateExistingExecution(executionId, execution);
        }
        const postExecutePromise = (0, n8n_workflow_1.createDeferredPromise)();
        this.activeExecutions[executionId] = {
            executionData,
            startedAt: new Date(),
            postExecutePromise,
            status: executionStatus,
        };
        void postExecutePromise.promise
            .catch((error) => {
            if (error instanceof n8n_workflow_1.ExecutionCancelledError)
                return;
            throw error;
        })
            .finally(() => {
            this.concurrencyControl.release({ mode: executionData.executionMode });
            delete this.activeExecutions[executionId];
            this.logger.debug('Execution removed', { executionId });
        });
        this.logger.debug('Execution added', { executionId });
        return executionId;
    }
    attachWorkflowExecution(executionId, workflowExecution) {
        this.getExecution(executionId).workflowExecution = workflowExecution;
    }
    attachResponsePromise(executionId, responsePromise) {
        this.getExecution(executionId).responsePromise = responsePromise;
    }
    resolveResponsePromise(executionId, response) {
        const execution = this.activeExecutions[executionId];
        execution?.responsePromise?.resolve(response);
    }
    stopExecution(executionId) {
        const execution = this.activeExecutions[executionId];
        if (execution === undefined) {
            return;
        }
        execution.workflowExecution?.cancel();
        execution.postExecutePromise.reject(new n8n_workflow_1.ExecutionCancelledError(executionId));
        this.logger.debug('Execution cancelled', { executionId });
    }
    finalizeExecution(executionId, fullRunData) {
        if (!this.has(executionId))
            return;
        const execution = this.getExecution(executionId);
        execution.postExecutePromise.resolve(fullRunData);
        this.logger.debug('Execution finalized', { executionId });
    }
    async getPostExecutePromise(executionId) {
        return await this.getExecution(executionId).postExecutePromise.promise;
    }
    getActiveExecutions() {
        const returnData = [];
        let data;
        for (const id of Object.keys(this.activeExecutions)) {
            data = this.activeExecutions[id];
            returnData.push({
                id,
                retryOf: data.executionData.retryOf,
                startedAt: data.startedAt,
                mode: data.executionData.executionMode,
                workflowId: data.executionData.workflowData.id,
                status: data.status,
            });
        }
        return returnData;
    }
    setStatus(executionId, status) {
        this.getExecution(executionId).status = status;
    }
    getStatus(executionId) {
        return this.getExecution(executionId).status;
    }
    async shutdown(cancelAll = false) {
        let executionIds = Object.keys(this.activeExecutions);
        if (config_1.default.getEnv('executions.mode') === 'regular') {
            this.concurrencyControl.disable();
        }
        if (cancelAll) {
            if (config_1.default.getEnv('executions.mode') === 'regular') {
                await this.concurrencyControl.removeAll(this.activeExecutions);
            }
            executionIds.forEach((executionId) => this.stopExecution(executionId));
        }
        let count = 0;
        while (executionIds.length !== 0) {
            if (count++ % 4 === 0) {
                this.logger.info(`Waiting for ${executionIds.length} active executions to finish...`);
            }
            await (0, n8n_workflow_1.sleep)(500);
            executionIds = Object.keys(this.activeExecutions);
        }
    }
    getExecution(executionId) {
        const execution = this.activeExecutions[executionId];
        if (!execution) {
            throw new execution_not_found_error_1.ExecutionNotFoundError(executionId);
        }
        return execution;
    }
};
exports.ActiveExecutions = ActiveExecutions;
exports.ActiveExecutions = ActiveExecutions = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [logger_service_1.Logger,
        execution_repository_1.ExecutionRepository,
        concurrency_control_service_1.ConcurrencyControlService])
], ActiveExecutions);
//# sourceMappingURL=active-executions.js.map