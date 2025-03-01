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
exports.WorkflowRunner = void 0;
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const p_cancelable_1 = __importDefault(require("p-cancelable"));
const typedi_1 = require("typedi");
const active_executions_1 = require("./active-executions");
const config_1 = __importDefault(require("./config"));
const execution_repository_1 = require("./databases/repositories/execution.repository");
const external_hooks_1 = require("./external-hooks");
const logger_service_1 = require("./logging/logger.service");
const node_types_1 = require("./node-types");
const permission_checker_1 = require("./user-management/permission-checker");
const WorkflowExecuteAdditionalData = __importStar(require("./workflow-execute-additional-data"));
const WorkflowHelpers = __importStar(require("./workflow-helpers"));
const workflow_helpers_1 = require("./workflow-helpers");
const workflow_static_data_service_1 = require("./workflows/workflow-static-data.service");
const execution_not_found_error_1 = require("./errors/execution-not-found-error");
const event_service_1 = require("./events/event.service");
let WorkflowRunner = class WorkflowRunner {
    constructor(logger, activeExecutions, executionRepository, externalHooks, workflowStaticDataService, nodeTypes, permissionChecker, eventService, instanceSettings) {
        this.logger = logger;
        this.activeExecutions = activeExecutions;
        this.executionRepository = executionRepository;
        this.externalHooks = externalHooks;
        this.workflowStaticDataService = workflowStaticDataService;
        this.nodeTypes = nodeTypes;
        this.permissionChecker = permissionChecker;
        this.eventService = eventService;
        this.instanceSettings = instanceSettings;
        this.executionsMode = config_1.default.getEnv('executions.mode');
    }
    async processError(error, startedAt, executionMode, executionId, hooks) {
        if (error instanceof execution_not_found_error_1.ExecutionNotFoundError) {
            return;
        }
        n8n_workflow_1.ErrorReporterProxy.error(error, { executionId });
        const isQueueMode = config_1.default.getEnv('executions.mode') === 'queue';
        if (isQueueMode && executionMode !== 'manual') {
            const executionWithoutData = await this.executionRepository.findSingleExecution(executionId, {
                includeData: false,
            });
            if (executionWithoutData?.finished === true && executionWithoutData?.status === 'success') {
                return;
            }
        }
        const fullRunData = {
            data: {
                resultData: {
                    error: {
                        ...error,
                        message: error.message,
                        stack: error.stack,
                    },
                    runData: {},
                },
            },
            finished: false,
            mode: executionMode,
            startedAt,
            stoppedAt: new Date(),
            status: 'error',
        };
        this.activeExecutions.finalizeExecution(executionId, fullRunData);
        if (hooks) {
            await hooks.executeHookFunctions('workflowExecuteAfter', [fullRunData]);
        }
    }
    async run(data, loadStaticData, realtime, restartExecutionId, responsePromise) {
        const executionId = await this.activeExecutions.add(data, restartExecutionId);
        const { id: workflowId, nodes } = data.workflowData;
        try {
            await this.permissionChecker.check(workflowId, nodes);
        }
        catch (error) {
            const runData = (0, workflow_helpers_1.generateFailedExecutionFromError)(data.executionMode, error, error.node);
            const workflowHooks = WorkflowExecuteAdditionalData.getWorkflowHooksMain(data, executionId);
            await workflowHooks.executeHookFunctions('workflowExecuteBefore', []);
            await workflowHooks.executeHookFunctions('workflowExecuteAfter', [runData]);
            responsePromise?.reject(error);
            this.activeExecutions.finalizeExecution(executionId);
            return executionId;
        }
        if (responsePromise) {
            this.activeExecutions.attachResponsePromise(executionId, responsePromise);
        }
        if (this.executionsMode === 'queue' && data.executionMode !== 'manual') {
            await this.enqueueExecution(executionId, data, loadStaticData, realtime);
        }
        else {
            await this.runMainProcess(executionId, data, loadStaticData, restartExecutionId);
            this.eventService.emit('workflow-pre-execute', { executionId, data });
        }
        if (this.executionsMode !== 'queue' ||
            this.instanceSettings.instanceType === 'worker' ||
            data.executionMode === 'manual') {
            const postExecutePromise = this.activeExecutions.getPostExecutePromise(executionId);
            postExecutePromise
                .then(async (executionData) => {
                this.eventService.emit('workflow-post-execute', {
                    workflow: data.workflowData,
                    executionId,
                    userId: data.userId,
                    runData: executionData,
                });
                if (this.externalHooks.exists('workflow.postExecute')) {
                    try {
                        await this.externalHooks.run('workflow.postExecute', [
                            executionData,
                            data.workflowData,
                            executionId,
                        ]);
                    }
                    catch (error) {
                        n8n_workflow_1.ErrorReporterProxy.error(error);
                        this.logger.error('There was a problem running hook "workflow.postExecute"', error);
                    }
                }
            })
                .catch((error) => {
                if (error instanceof n8n_workflow_1.ExecutionCancelledError)
                    return;
                n8n_workflow_1.ErrorReporterProxy.error(error);
                this.logger.error('There was a problem running internal hook "onWorkflowPostExecute"', error);
            });
        }
        return executionId;
    }
    async runMainProcess(executionId, data, loadStaticData, restartExecutionId) {
        const workflowId = data.workflowData.id;
        if (loadStaticData === true && workflowId) {
            data.workflowData.staticData =
                await this.workflowStaticDataService.getStaticDataById(workflowId);
        }
        let executionTimeout;
        const workflowSettings = data.workflowData.settings ?? {};
        let workflowTimeout = workflowSettings.executionTimeout ?? config_1.default.getEnv('executions.timeout');
        if (workflowTimeout > 0) {
            workflowTimeout = Math.min(workflowTimeout, config_1.default.getEnv('executions.maxTimeout'));
        }
        let pinData;
        if (data.executionMode === 'manual') {
            pinData = data.pinData ?? data.workflowData.pinData;
        }
        const workflow = new n8n_workflow_1.Workflow({
            id: workflowId,
            name: data.workflowData.name,
            nodes: data.workflowData.nodes,
            connections: data.workflowData.connections,
            active: data.workflowData.active,
            nodeTypes: this.nodeTypes,
            staticData: data.workflowData.staticData,
            settings: workflowSettings,
            pinData,
        });
        const additionalData = await WorkflowExecuteAdditionalData.getBase(data.userId, undefined, workflowTimeout <= 0 ? undefined : Date.now() + workflowTimeout * 1000);
        additionalData.restartExecutionId = restartExecutionId;
        additionalData.executionId = executionId;
        this.logger.debug(`Execution for workflow ${data.workflowData.name} was assigned id ${executionId}`, { executionId });
        let workflowExecution;
        await this.executionRepository.setRunning(executionId);
        try {
            additionalData.hooks = WorkflowExecuteAdditionalData.getWorkflowHooksMain(data, executionId);
            additionalData.hooks.hookFunctions.sendResponse = [
                async (response) => {
                    this.activeExecutions.resolveResponsePromise(executionId, response);
                },
            ];
            additionalData.setExecutionStatus = WorkflowExecuteAdditionalData.setExecutionStatus.bind({
                executionId,
            });
            additionalData.sendDataToUI = WorkflowExecuteAdditionalData.sendDataToUI.bind({
                pushRef: data.pushRef,
            });
            if (data.executionData !== undefined) {
                this.logger.debug(`Execution ID ${executionId} had Execution data. Running with payload.`, {
                    executionId,
                });
                const workflowExecute = new n8n_core_1.WorkflowExecute(additionalData, data.executionMode, data.executionData);
                workflowExecution = workflowExecute.processRunExecutionData(workflow);
            }
            else if (data.runData === undefined ||
                data.startNodes === undefined ||
                data.startNodes.length === 0) {
                this.logger.debug(`Execution ID ${executionId} will run executing all nodes.`, {
                    executionId,
                });
                const startNode = WorkflowHelpers.getExecutionStartNode(data, workflow);
                const workflowExecute = new n8n_core_1.WorkflowExecute(additionalData, data.executionMode);
                workflowExecution = workflowExecute.run(workflow, startNode, data.destinationNode, data.pinData);
            }
            else {
                this.logger.debug(`Execution ID ${executionId} is a partial execution.`, { executionId });
                const workflowExecute = new n8n_core_1.WorkflowExecute(additionalData, data.executionMode);
                if (data.partialExecutionVersion === '1') {
                    workflowExecution = workflowExecute.runPartialWorkflow2(workflow, data.runData, data.destinationNode, data.pinData);
                }
                else {
                    workflowExecution = workflowExecute.runPartialWorkflow(workflow, data.runData, data.startNodes, data.destinationNode, data.pinData);
                }
            }
            this.activeExecutions.attachWorkflowExecution(executionId, workflowExecution);
            if (workflowTimeout > 0) {
                const timeout = Math.min(workflowTimeout, config_1.default.getEnv('executions.maxTimeout')) * 1000;
                executionTimeout = setTimeout(() => {
                    void this.activeExecutions.stopExecution(executionId);
                }, timeout);
            }
            workflowExecution
                .then((fullRunData) => {
                clearTimeout(executionTimeout);
                if (workflowExecution.isCanceled) {
                    fullRunData.finished = false;
                }
                fullRunData.status = this.activeExecutions.getStatus(executionId);
                this.activeExecutions.finalizeExecution(executionId, fullRunData);
            })
                .catch(async (error) => await this.processError(error, new Date(), data.executionMode, executionId, additionalData.hooks));
        }
        catch (error) {
            await this.processError(error, new Date(), data.executionMode, executionId, additionalData.hooks);
            throw error;
        }
    }
    async enqueueExecution(executionId, data, loadStaticData, realtime) {
        const jobData = {
            executionId,
            loadStaticData: !!loadStaticData,
        };
        if (!this.scalingService) {
            const { ScalingService } = await Promise.resolve().then(() => __importStar(require('./scaling/scaling.service')));
            this.scalingService = typedi_1.Container.get(ScalingService);
        }
        let job;
        let hooks;
        try {
            job = await this.scalingService.addJob(jobData, { priority: realtime ? 50 : 100 });
            hooks = WorkflowExecuteAdditionalData.getWorkflowHooksWorkerMain(data.executionMode, executionId, data.workflowData, { retryOf: data.retryOf ? data.retryOf.toString() : undefined });
            await hooks.executeHookFunctions('workflowExecuteBefore', []);
        }
        catch (error) {
            const hooks = WorkflowExecuteAdditionalData.getWorkflowHooksWorkerExecuter(data.executionMode, executionId, data.workflowData, { retryOf: data.retryOf ? data.retryOf.toString() : undefined });
            await this.processError(error, new Date(), data.executionMode, executionId, hooks);
            throw error;
        }
        const workflowExecution = new p_cancelable_1.default(async (resolve, reject, onCancel) => {
            onCancel.shouldReject = false;
            onCancel(async () => {
                await this.scalingService.stopJob(job);
                const hooksWorker = WorkflowExecuteAdditionalData.getWorkflowHooksWorkerExecuter(data.executionMode, executionId, data.workflowData, { retryOf: data.retryOf ? data.retryOf.toString() : undefined });
                const error = new n8n_workflow_1.ExecutionCancelledError(executionId);
                await this.processError(error, new Date(), data.executionMode, executionId, hooksWorker);
                reject(error);
            });
            try {
                await job.finished();
            }
            catch (error) {
                const hooks = WorkflowExecuteAdditionalData.getWorkflowHooksWorkerExecuter(data.executionMode, executionId, data.workflowData, { retryOf: data.retryOf ? data.retryOf.toString() : undefined });
                this.logger.error(`Problem with execution ${executionId}: ${error.message}. Aborting.`);
                await this.processError(error, new Date(), data.executionMode, executionId, hooks);
                reject(error);
            }
            const fullExecutionData = await this.executionRepository.findSingleExecution(executionId, {
                includeData: true,
                unflattenData: true,
            });
            if (!fullExecutionData) {
                return reject(new Error(`Could not find execution with id "${executionId}"`));
            }
            const runData = {
                finished: fullExecutionData.finished,
                mode: fullExecutionData.mode,
                startedAt: fullExecutionData.startedAt,
                stoppedAt: fullExecutionData.stoppedAt,
                status: fullExecutionData.status,
                data: fullExecutionData.data,
            };
            this.activeExecutions.finalizeExecution(executionId, runData);
            await hooks.executeHookFunctions('workflowExecuteAfter', [runData]);
            resolve(runData);
        });
        workflowExecution.catch(() => {
        });
        this.activeExecutions.attachWorkflowExecution(executionId, workflowExecution);
    }
};
exports.WorkflowRunner = WorkflowRunner;
exports.WorkflowRunner = WorkflowRunner = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [logger_service_1.Logger,
        active_executions_1.ActiveExecutions,
        execution_repository_1.ExecutionRepository,
        external_hooks_1.ExternalHooks,
        workflow_static_data_service_1.WorkflowStaticDataService,
        node_types_1.NodeTypes,
        permission_checker_1.PermissionChecker,
        event_service_1.EventService,
        n8n_core_1.InstanceSettings])
], WorkflowRunner);
//# sourceMappingURL=workflow-runner.js.map