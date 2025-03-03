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
exports.WaitTracker = void 0;
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const typedi_1 = require("typedi");
const execution_repository_1 = require("./databases/repositories/execution.repository");
const logger_service_1 = require("./logging/logger.service");
const orchestration_service_1 = require("./services/orchestration.service");
const ownership_service_1 = require("./services/ownership.service");
const workflow_runner_1 = require("./workflow-runner");
let WaitTracker = class WaitTracker {
    constructor(logger, executionRepository, ownershipService, workflowRunner, orchestrationService, instanceSettings) {
        this.logger = logger;
        this.executionRepository = executionRepository;
        this.ownershipService = ownershipService;
        this.workflowRunner = workflowRunner;
        this.orchestrationService = orchestrationService;
        this.instanceSettings = instanceSettings;
        this.waitingExecutions = {};
        this.logger = this.logger.scoped('waiting-executions');
    }
    has(executionId) {
        return this.waitingExecutions[executionId] !== undefined;
    }
    init() {
        const { isLeader } = this.instanceSettings;
        const { isMultiMainSetupEnabled } = this.orchestrationService;
        if (isLeader)
            this.startTracking();
        if (isMultiMainSetupEnabled) {
            this.orchestrationService.multiMainSetup
                .on('leader-takeover', () => this.startTracking())
                .on('leader-stepdown', () => this.stopTracking());
        }
    }
    startTracking() {
        this.logger.debug('Started tracking waiting executions');
        this.mainTimer = setInterval(() => {
            void this.getWaitingExecutions();
        }, 60000);
        void this.getWaitingExecutions();
    }
    async getWaitingExecutions() {
        this.logger.debug('Querying database for waiting executions');
        const executions = await this.executionRepository.getWaitingExecutions();
        if (executions.length === 0) {
            return;
        }
        const executionIds = executions.map((execution) => execution.id).join(', ');
        this.logger.debug(`Found ${executions.length} executions. Setting timer for IDs: ${executionIds}`);
        for (const execution of executions) {
            const executionId = execution.id;
            if (this.waitingExecutions[executionId] === undefined) {
                const triggerTime = execution.waitTill.getTime() - new Date().getTime();
                this.waitingExecutions[executionId] = {
                    executionId,
                    timer: setTimeout(() => {
                        this.startExecution(executionId);
                    }, triggerTime),
                };
            }
        }
    }
    stopExecution(executionId) {
        if (!this.waitingExecutions[executionId])
            return;
        clearTimeout(this.waitingExecutions[executionId].timer);
        delete this.waitingExecutions[executionId];
    }
    startExecution(executionId) {
        this.logger.debug(`Resuming execution ${executionId}`, { executionId });
        delete this.waitingExecutions[executionId];
        (async () => {
            const fullExecutionData = await this.executionRepository.findSingleExecution(executionId, {
                includeData: true,
                unflattenData: true,
            });
            if (!fullExecutionData) {
                throw new n8n_workflow_1.ApplicationError('Execution does not exist.', { extra: { executionId } });
            }
            if (fullExecutionData.finished) {
                throw new n8n_workflow_1.ApplicationError('The execution did succeed and can so not be started again.');
            }
            if (!fullExecutionData.workflowData.id) {
                throw new n8n_workflow_1.ApplicationError('Only saved workflows can be resumed.');
            }
            const workflowId = fullExecutionData.workflowData.id;
            const project = await this.ownershipService.getWorkflowProjectCached(workflowId);
            const data = {
                executionMode: fullExecutionData.mode,
                executionData: fullExecutionData.data,
                workflowData: fullExecutionData.workflowData,
                projectId: project.id,
            };
            await this.workflowRunner.run(data, false, false, executionId);
        })().catch((error) => {
            n8n_workflow_1.ErrorReporterProxy.error(error);
            this.logger.error(`There was a problem starting the waiting execution with id "${executionId}": "${error.message}"`, { executionId });
        });
    }
    stopTracking() {
        this.logger.debug('Shutting down wait tracking');
        clearInterval(this.mainTimer);
        Object.keys(this.waitingExecutions).forEach((executionId) => {
            clearTimeout(this.waitingExecutions[executionId].timer);
        });
    }
};
exports.WaitTracker = WaitTracker;
exports.WaitTracker = WaitTracker = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [logger_service_1.Logger,
        execution_repository_1.ExecutionRepository,
        ownership_service_1.OwnershipService,
        workflow_runner_1.WorkflowRunner,
        orchestration_service_1.OrchestrationService,
        n8n_core_1.InstanceSettings])
], WaitTracker);
//# sourceMappingURL=wait-tracker.js.map