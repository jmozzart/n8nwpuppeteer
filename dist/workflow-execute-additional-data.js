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
exports.objectToError = objectToError;
exports.executeErrorWorkflow = executeErrorWorkflow;
exports.hookFunctionsPreExecute = hookFunctionsPreExecute;
exports.getRunData = getRunData;
exports.getWorkflowData = getWorkflowData;
exports.executeWorkflow = executeWorkflow;
exports.setExecutionStatus = setExecutionStatus;
exports.sendDataToUI = sendDataToUI;
exports.getBase = getBase;
exports.getWorkflowHooksWorkerExecuter = getWorkflowHooksWorkerExecuter;
exports.getWorkflowHooksWorkerMain = getWorkflowHooksWorkerMain;
exports.getWorkflowHooksMain = getWorkflowHooksMain;
const config_1 = require("@n8n/config");
const flatted_1 = require("flatted");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const typedi_1 = require("typedi");
const active_executions_1 = require("./active-executions");
const config_2 = __importDefault(require("./config"));
const credentials_helper_1 = require("./credentials-helper");
const execution_repository_1 = require("./databases/repositories/execution.repository");
const external_hooks_1 = require("./external-hooks");
const node_types_1 = require("./node-types");
const push_1 = require("./push");
const workflow_statistics_service_1 = require("./services/workflow-statistics.service");
const utils_1 = require("./utils");
const WorkflowHelpers = __importStar(require("./workflow-helpers"));
const workflow_repository_1 = require("./databases/repositories/workflow.repository");
const event_service_1 = require("./events/event.service");
const restore_binary_data_id_1 = require("./execution-lifecycle-hooks/restore-binary-data-id");
const save_execution_progress_1 = require("./execution-lifecycle-hooks/save-execution-progress");
const shared_hook_functions_1 = require("./execution-lifecycle-hooks/shared/shared-hook-functions");
const to_save_settings_1 = require("./execution-lifecycle-hooks/to-save-settings");
const logger_service_1 = require("./logging/logger.service");
const task_manager_1 = require("./runners/task-managers/task-manager");
const secrets_helpers_1 = require("./secrets-helpers");
const ownership_service_1 = require("./services/ownership.service");
const url_service_1 = require("./services/url.service");
const subworkflow_policy_checker_service_1 = require("./subworkflows/subworkflow-policy-checker.service");
const permission_checker_1 = require("./user-management/permission-checker");
const workflow_execution_service_1 = require("./workflows/workflow-execution.service");
const workflow_static_data_service_1 = require("./workflows/workflow-static-data.service");
function objectToError(errorObject, workflow) {
    if (errorObject instanceof Error) {
        return errorObject;
    }
    else if (errorObject && typeof errorObject === 'object' && 'message' in errorObject) {
        let error;
        if ('node' in errorObject) {
            const node = workflow.getNode(errorObject.node.name);
            if (node) {
                error = new n8n_workflow_1.NodeOperationError(node, errorObject, errorObject);
            }
        }
        if (error === undefined) {
            error = new Error(errorObject.message);
        }
        if ('description' in errorObject) {
            error.description = errorObject.description;
        }
        if ('stack' in errorObject) {
            error.stack = errorObject.stack;
        }
        return error;
    }
    else {
        return new Error('An error occurred');
    }
}
function executeErrorWorkflow(workflowData, fullRunData, mode, executionId, retryOf) {
    const logger = typedi_1.Container.get(logger_service_1.Logger);
    let pastExecutionUrl;
    if (executionId !== undefined) {
        pastExecutionUrl = `${typedi_1.Container.get(url_service_1.UrlService).getWebhookBaseUrl()}workflow/${workflowData.id}/executions/${executionId}`;
    }
    if (fullRunData.data.resultData.error !== undefined) {
        let workflowErrorData;
        const workflowId = workflowData.id;
        if (executionId) {
            workflowErrorData = {
                execution: {
                    id: executionId,
                    url: pastExecutionUrl,
                    error: fullRunData.data.resultData.error,
                    lastNodeExecuted: fullRunData.data.resultData.lastNodeExecuted,
                    mode,
                    retryOf,
                },
                workflow: {
                    id: workflowId,
                    name: workflowData.name,
                },
            };
        }
        else {
            workflowErrorData = {
                trigger: {
                    error: fullRunData.data.resultData.error,
                    mode,
                },
                workflow: {
                    id: workflowId,
                    name: workflowData.name,
                },
            };
        }
        const { errorTriggerType } = typedi_1.Container.get(config_1.GlobalConfig).nodes;
        const { errorWorkflow } = workflowData.settings ?? {};
        if (errorWorkflow && !(mode === 'error' && workflowId && errorWorkflow === workflowId)) {
            logger.debug('Start external error workflow', {
                executionId,
                errorWorkflowId: errorWorkflow,
                workflowId,
            });
            if (!workflowId) {
                return;
            }
            typedi_1.Container.get(ownership_service_1.OwnershipService)
                .getWorkflowProjectCached(workflowId)
                .then((project) => {
                void typedi_1.Container.get(workflow_execution_service_1.WorkflowExecutionService).executeErrorWorkflow(errorWorkflow, workflowErrorData, project);
            })
                .catch((error) => {
                n8n_workflow_1.ErrorReporterProxy.error(error);
                logger.error(`Could not execute ErrorWorkflow for execution ID ${this.executionId} because of error querying the workflow owner`, {
                    executionId,
                    errorWorkflowId: errorWorkflow,
                    workflowId,
                    error,
                    workflowErrorData,
                });
            });
        }
        else if (mode !== 'error' &&
            workflowId !== undefined &&
            workflowData.nodes.some((node) => node.type === errorTriggerType)) {
            logger.debug('Start internal error workflow', { executionId, workflowId });
            void typedi_1.Container.get(ownership_service_1.OwnershipService)
                .getWorkflowProjectCached(workflowId)
                .then((project) => {
                void typedi_1.Container.get(workflow_execution_service_1.WorkflowExecutionService).executeErrorWorkflow(workflowId, workflowErrorData, project);
            });
        }
    }
}
function hookFunctionsPush() {
    const logger = typedi_1.Container.get(logger_service_1.Logger);
    const pushInstance = typedi_1.Container.get(push_1.Push);
    return {
        nodeExecuteBefore: [
            async function (nodeName) {
                const { pushRef, executionId } = this;
                if (pushRef === undefined) {
                    return;
                }
                logger.debug(`Executing hook on node "${nodeName}" (hookFunctionsPush)`, {
                    executionId,
                    pushRef,
                    workflowId: this.workflowData.id,
                });
                pushInstance.send('nodeExecuteBefore', { executionId, nodeName }, pushRef);
            },
        ],
        nodeExecuteAfter: [
            async function (nodeName, data) {
                const { pushRef, executionId } = this;
                if (pushRef === undefined) {
                    return;
                }
                logger.debug(`Executing hook on node "${nodeName}" (hookFunctionsPush)`, {
                    executionId,
                    pushRef,
                    workflowId: this.workflowData.id,
                });
                pushInstance.send('nodeExecuteAfter', { executionId, nodeName, data }, pushRef);
            },
        ],
        workflowExecuteBefore: [
            async function () {
                const { pushRef, executionId } = this;
                const { id: workflowId, name: workflowName } = this.workflowData;
                logger.debug('Executing hook (hookFunctionsPush)', {
                    executionId,
                    pushRef,
                    workflowId,
                });
                if (pushRef === undefined) {
                    return;
                }
                pushInstance.send('executionStarted', {
                    executionId,
                    mode: this.mode,
                    startedAt: new Date(),
                    retryOf: this.retryOf,
                    workflowId,
                    workflowName,
                }, pushRef);
            },
        ],
        workflowExecuteAfter: [
            async function (fullRunData) {
                const { pushRef, executionId } = this;
                if (pushRef === undefined)
                    return;
                const { id: workflowId } = this.workflowData;
                logger.debug('Executing hook (hookFunctionsPush)', {
                    executionId,
                    pushRef,
                    workflowId,
                });
                const { status } = fullRunData;
                if (status === 'waiting') {
                    pushInstance.send('executionWaiting', { executionId }, pushRef);
                }
                else {
                    const rawData = (0, flatted_1.stringify)(fullRunData.data);
                    pushInstance.send('executionFinished', { executionId, workflowId, status, rawData }, pushRef);
                }
            },
        ],
    };
}
function hookFunctionsPreExecute() {
    const externalHooks = typedi_1.Container.get(external_hooks_1.ExternalHooks);
    return {
        workflowExecuteBefore: [
            async function (workflow) {
                await externalHooks.run('workflow.preExecute', [workflow, this.mode]);
            },
        ],
        nodeExecuteAfter: [
            async function (nodeName, data, executionData) {
                await (0, save_execution_progress_1.saveExecutionProgress)(this.workflowData, this.executionId, nodeName, data, executionData, this.pushRef);
            },
        ],
    };
}
function hookFunctionsSave() {
    const logger = typedi_1.Container.get(logger_service_1.Logger);
    const workflowStatisticsService = typedi_1.Container.get(workflow_statistics_service_1.WorkflowStatisticsService);
    const eventService = typedi_1.Container.get(event_service_1.EventService);
    return {
        nodeExecuteBefore: [
            async function (nodeName) {
                const { executionId, workflowData: workflow } = this;
                eventService.emit('node-pre-execute', { executionId, workflow, nodeName });
            },
        ],
        nodeExecuteAfter: [
            async function (nodeName) {
                const { executionId, workflowData: workflow } = this;
                eventService.emit('node-post-execute', { executionId, workflow, nodeName });
            },
        ],
        workflowExecuteBefore: [],
        workflowExecuteAfter: [
            async function (fullRunData, newStaticData) {
                logger.debug('Executing hook (hookFunctionsSave)', {
                    executionId: this.executionId,
                    workflowId: this.workflowData.id,
                });
                await (0, restore_binary_data_id_1.restoreBinaryDataId)(fullRunData, this.executionId, this.mode);
                const isManualMode = this.mode === 'manual';
                try {
                    if (!isManualMode && (0, utils_1.isWorkflowIdValid)(this.workflowData.id) && newStaticData) {
                        try {
                            await typedi_1.Container.get(workflow_static_data_service_1.WorkflowStaticDataService).saveStaticDataById(this.workflowData.id, newStaticData);
                        }
                        catch (e) {
                            n8n_workflow_1.ErrorReporterProxy.error(e);
                            logger.error(`There was a problem saving the workflow with id "${this.workflowData.id}" to save changed staticData: "${e.message}" (hookFunctionsSave)`, { executionId: this.executionId, workflowId: this.workflowData.id });
                        }
                    }
                    const executionStatus = (0, shared_hook_functions_1.determineFinalExecutionStatus)(fullRunData);
                    fullRunData.status = executionStatus;
                    const saveSettings = (0, to_save_settings_1.toSaveSettings)(this.workflowData.settings);
                    if (isManualMode && !saveSettings.manual && !fullRunData.waitTill) {
                        await typedi_1.Container.get(execution_repository_1.ExecutionRepository).softDelete(this.executionId);
                        return;
                    }
                    const shouldNotSave = (executionStatus === 'success' && !saveSettings.success) ||
                        (executionStatus !== 'success' && !saveSettings.error);
                    if (shouldNotSave && !fullRunData.waitTill && !isManualMode) {
                        executeErrorWorkflow(this.workflowData, fullRunData, this.mode, this.executionId, this.retryOf);
                        await typedi_1.Container.get(execution_repository_1.ExecutionRepository).hardDelete({
                            workflowId: this.workflowData.id,
                            executionId: this.executionId,
                        });
                        return;
                    }
                    const fullExecutionData = (0, shared_hook_functions_1.prepareExecutionDataForDbUpdate)({
                        runData: fullRunData,
                        workflowData: this.workflowData,
                        workflowStatusFinal: executionStatus,
                        retryOf: this.retryOf,
                    });
                    if (fullRunData.waitTill && isManualMode) {
                        fullExecutionData.data.pushRef = this.pushRef;
                    }
                    await (0, shared_hook_functions_1.updateExistingExecution)({
                        executionId: this.executionId,
                        workflowId: this.workflowData.id,
                        executionData: fullExecutionData,
                    });
                    if (!isManualMode) {
                        executeErrorWorkflow(this.workflowData, fullRunData, this.mode, this.executionId, this.retryOf);
                    }
                }
                catch (error) {
                    n8n_workflow_1.ErrorReporterProxy.error(error);
                    logger.error(`Failed saving execution data to DB on execution ID ${this.executionId}`, {
                        executionId: this.executionId,
                        workflowId: this.workflowData.id,
                        error,
                    });
                    if (!isManualMode) {
                        executeErrorWorkflow(this.workflowData, fullRunData, this.mode, this.executionId, this.retryOf);
                    }
                }
                finally {
                    workflowStatisticsService.emit('workflowExecutionCompleted', {
                        workflowData: this.workflowData,
                        fullRunData,
                    });
                }
            },
        ],
        nodeFetchedData: [
            async (workflowId, node) => {
                workflowStatisticsService.emit('nodeFetchedData', { workflowId, node });
            },
        ],
    };
}
function hookFunctionsSaveWorker() {
    const logger = typedi_1.Container.get(logger_service_1.Logger);
    const workflowStatisticsService = typedi_1.Container.get(workflow_statistics_service_1.WorkflowStatisticsService);
    const eventService = typedi_1.Container.get(event_service_1.EventService);
    return {
        nodeExecuteBefore: [
            async function (nodeName) {
                const { executionId, workflowData: workflow } = this;
                eventService.emit('node-pre-execute', { executionId, workflow, nodeName });
            },
        ],
        nodeExecuteAfter: [
            async function (nodeName) {
                const { executionId, workflowData: workflow } = this;
                eventService.emit('node-post-execute', { executionId, workflow, nodeName });
            },
        ],
        workflowExecuteBefore: [
            async function () {
                const { executionId, workflowData } = this;
                eventService.emit('workflow-pre-execute', { executionId, data: workflowData });
            },
        ],
        workflowExecuteAfter: [
            async function (fullRunData, newStaticData) {
                logger.debug('Executing hook (hookFunctionsSaveWorker)', {
                    executionId: this.executionId,
                    workflowId: this.workflowData.id,
                });
                try {
                    if ((0, utils_1.isWorkflowIdValid)(this.workflowData.id) && newStaticData) {
                        try {
                            await typedi_1.Container.get(workflow_static_data_service_1.WorkflowStaticDataService).saveStaticDataById(this.workflowData.id, newStaticData);
                        }
                        catch (e) {
                            n8n_workflow_1.ErrorReporterProxy.error(e);
                            logger.error(`There was a problem saving the workflow with id "${this.workflowData.id}" to save changed staticData: "${e.message}" (workflowExecuteAfter)`, { pushRef: this.pushRef, workflowId: this.workflowData.id });
                        }
                    }
                    const workflowStatusFinal = (0, shared_hook_functions_1.determineFinalExecutionStatus)(fullRunData);
                    fullRunData.status = workflowStatusFinal;
                    if (workflowStatusFinal !== 'success' && workflowStatusFinal !== 'waiting') {
                        executeErrorWorkflow(this.workflowData, fullRunData, this.mode, this.executionId, this.retryOf);
                    }
                    const fullExecutionData = (0, shared_hook_functions_1.prepareExecutionDataForDbUpdate)({
                        runData: fullRunData,
                        workflowData: this.workflowData,
                        workflowStatusFinal,
                        retryOf: this.retryOf,
                    });
                    await (0, shared_hook_functions_1.updateExistingExecution)({
                        executionId: this.executionId,
                        workflowId: this.workflowData.id,
                        executionData: fullExecutionData,
                    });
                }
                catch (error) {
                    executeErrorWorkflow(this.workflowData, fullRunData, this.mode, this.executionId, this.retryOf);
                }
                finally {
                    workflowStatisticsService.emit('workflowExecutionCompleted', {
                        workflowData: this.workflowData,
                        fullRunData,
                    });
                }
            },
            async function (runData) {
                const { executionId, workflowData: workflow } = this;
                eventService.emit('workflow-post-execute', {
                    workflow,
                    executionId,
                    runData,
                });
            },
            async function (fullRunData) {
                const externalHooks = typedi_1.Container.get(external_hooks_1.ExternalHooks);
                if (externalHooks.exists('workflow.postExecute')) {
                    try {
                        await externalHooks.run('workflow.postExecute', [
                            fullRunData,
                            this.workflowData,
                            this.executionId,
                        ]);
                    }
                    catch (error) {
                        n8n_workflow_1.ErrorReporterProxy.error(error);
                        typedi_1.Container.get(logger_service_1.Logger).error('There was a problem running hook "workflow.postExecute"', error);
                    }
                }
            },
        ],
        nodeFetchedData: [
            async (workflowId, node) => {
                workflowStatisticsService.emit('nodeFetchedData', { workflowId, node });
            },
        ],
    };
}
async function getRunData(workflowData, inputData, parentExecution) {
    const mode = 'integrated';
    const startingNode = (0, utils_1.findSubworkflowStart)(workflowData.nodes);
    inputData = inputData || [
        {
            json: {},
        },
    ];
    const nodeExecutionStack = [];
    nodeExecutionStack.push({
        node: startingNode,
        data: {
            main: [inputData],
        },
        metadata: { parentExecution },
        source: null,
    });
    const runExecutionData = {
        startData: {},
        resultData: {
            runData: {},
        },
        executionData: {
            contextData: {},
            metadata: {},
            nodeExecutionStack,
            waitingExecution: {},
            waitingExecutionSource: {},
        },
    };
    return {
        executionMode: mode,
        executionData: runExecutionData,
        workflowData,
    };
}
async function getWorkflowData(workflowInfo, parentWorkflowId, parentWorkflowSettings) {
    if (workflowInfo.id === undefined && workflowInfo.code === undefined) {
        throw new n8n_workflow_1.ApplicationError('No information about the workflow to execute found. Please provide either the "id" or "code"!');
    }
    let workflowData;
    if (workflowInfo.id !== undefined) {
        const relations = config_2.default.getEnv('workflowTagsDisabled') ? [] : ['tags'];
        workflowData = await typedi_1.Container.get(workflow_repository_1.WorkflowRepository).get({ id: workflowInfo.id }, { relations });
        if (workflowData === undefined || workflowData === null) {
            throw new n8n_workflow_1.ApplicationError('Workflow does not exist.', {
                extra: { workflowId: workflowInfo.id },
            });
        }
    }
    else {
        workflowData = workflowInfo.code ?? null;
        if (workflowData) {
            if (!workflowData.id) {
                workflowData.id = parentWorkflowId;
            }
            if (!workflowData.settings) {
                workflowData.settings = parentWorkflowSettings;
            }
        }
    }
    return workflowData;
}
async function executeWorkflow(workflowInfo, additionalData, options) {
    const activeExecutions = typedi_1.Container.get(active_executions_1.ActiveExecutions);
    const workflowData = options.loadedWorkflowData ??
        (await getWorkflowData(workflowInfo, options.parentWorkflowId, options.parentWorkflowSettings));
    const runData = options.loadedRunData ??
        (await getRunData(workflowData, options.inputData, options.parentExecution));
    const executionId = await activeExecutions.add(runData);
    const executionPromise = startExecution(additionalData, options, executionId, runData, workflowData);
    if (options.doNotWaitToFinish) {
        return { executionId, data: [null] };
    }
    return await executionPromise;
}
async function startExecution(additionalData, options, executionId, runData, workflowData) {
    const externalHooks = typedi_1.Container.get(external_hooks_1.ExternalHooks);
    await externalHooks.init();
    const nodeTypes = typedi_1.Container.get(node_types_1.NodeTypes);
    const activeExecutions = typedi_1.Container.get(active_executions_1.ActiveExecutions);
    const eventService = typedi_1.Container.get(event_service_1.EventService);
    const executionRepository = typedi_1.Container.get(execution_repository_1.ExecutionRepository);
    const workflowName = workflowData ? workflowData.name : undefined;
    const workflow = new n8n_workflow_1.Workflow({
        id: workflowData.id,
        name: workflowName,
        nodes: workflowData.nodes,
        connections: workflowData.connections,
        active: workflowData.active,
        nodeTypes,
        staticData: workflowData.staticData,
        settings: workflowData.settings,
    });
    await executionRepository.setRunning(executionId);
    typedi_1.Container.get(event_service_1.EventService).emit('workflow-pre-execute', { executionId, data: runData });
    let data;
    try {
        await typedi_1.Container.get(permission_checker_1.PermissionChecker).check(workflowData.id, workflowData.nodes);
        await typedi_1.Container.get(subworkflow_policy_checker_service_1.SubworkflowPolicyChecker).check(workflow, options.parentWorkflowId, options.node, additionalData.userId);
        const additionalDataIntegrated = await getBase();
        additionalDataIntegrated.hooks = getWorkflowHooksIntegrated(runData.executionMode, executionId, workflowData);
        additionalDataIntegrated.executionId = executionId;
        additionalDataIntegrated.parentCallbackManager = options.parentCallbackManager;
        additionalDataIntegrated.executeWorkflow = additionalData.executeWorkflow;
        let subworkflowTimeout = additionalData.executionTimeoutTimestamp;
        const workflowSettings = workflowData.settings;
        if (workflowSettings?.executionTimeout !== undefined && workflowSettings.executionTimeout > 0) {
            subworkflowTimeout = Math.min(additionalData.executionTimeoutTimestamp || Number.MAX_SAFE_INTEGER, Date.now() + workflowSettings.executionTimeout * 1000);
        }
        additionalDataIntegrated.executionTimeoutTimestamp = subworkflowTimeout;
        const runExecutionData = runData.executionData;
        const workflowExecute = new n8n_core_1.WorkflowExecute(additionalDataIntegrated, runData.executionMode, runExecutionData);
        const execution = workflowExecute.processRunExecutionData(workflow);
        activeExecutions.attachWorkflowExecution(executionId, execution);
        data = await execution;
    }
    catch (error) {
        const executionError = error ? error : undefined;
        const fullRunData = {
            data: {
                resultData: {
                    error: executionError,
                    runData: {},
                },
            },
            finished: false,
            mode: 'integrated',
            startedAt: new Date(),
            stoppedAt: new Date(),
            status: 'error',
        };
        const fullExecutionData = {
            data: fullRunData.data,
            mode: fullRunData.mode,
            finished: fullRunData.finished ? fullRunData.finished : false,
            startedAt: fullRunData.startedAt,
            stoppedAt: fullRunData.stoppedAt,
            status: fullRunData.status,
            workflowData,
            workflowId: workflowData.id,
        };
        if (workflowData.id) {
            fullExecutionData.workflowId = workflowData.id;
        }
        activeExecutions.finalizeExecution(executionId, fullRunData);
        await executionRepository.updateExistingExecution(executionId, fullExecutionData);
        throw objectToError({
            ...executionError,
            stack: executionError?.stack,
            message: executionError?.message,
        }, workflow);
    }
    await externalHooks.run('workflow.postExecute', [data, workflowData, executionId]);
    eventService.emit('workflow-post-execute', {
        workflow: workflowData,
        executionId,
        userId: additionalData.userId,
        runData: data,
    });
    if (data.finished === true || data.status === 'waiting') {
        activeExecutions.finalizeExecution(executionId, data);
        const returnData = WorkflowHelpers.getDataLastExecutedNodeData(data);
        return {
            executionId,
            data: returnData.data.main,
        };
    }
    activeExecutions.finalizeExecution(executionId, data);
    const { error } = data.data.resultData;
    throw objectToError({
        ...error,
        stack: error?.stack,
    }, workflow);
}
function setExecutionStatus(status) {
    const logger = typedi_1.Container.get(logger_service_1.Logger);
    if (this.executionId === undefined) {
        logger.debug(`Setting execution status "${status}" failed because executionId is undefined`);
        return;
    }
    logger.debug(`Setting execution status for ${this.executionId} to "${status}"`);
    typedi_1.Container.get(active_executions_1.ActiveExecutions).setStatus(this.executionId, status);
}
function sendDataToUI(type, data) {
    const { pushRef } = this;
    if (pushRef === undefined) {
        return;
    }
    try {
        const pushInstance = typedi_1.Container.get(push_1.Push);
        pushInstance.send(type, data, pushRef);
    }
    catch (error) {
        const logger = typedi_1.Container.get(logger_service_1.Logger);
        logger.warn(`There was a problem sending message to UI: ${error.message}`);
    }
}
async function getBase(userId, currentNodeParameters, executionTimeoutTimestamp) {
    const urlBaseWebhook = typedi_1.Container.get(url_service_1.UrlService).getWebhookBaseUrl();
    const globalConfig = typedi_1.Container.get(config_1.GlobalConfig);
    const variables = await WorkflowHelpers.getVariables();
    const eventService = typedi_1.Container.get(event_service_1.EventService);
    return {
        credentialsHelper: typedi_1.Container.get(credentials_helper_1.CredentialsHelper),
        executeWorkflow,
        restApiUrl: urlBaseWebhook + globalConfig.endpoints.rest,
        instanceBaseUrl: urlBaseWebhook,
        formWaitingBaseUrl: urlBaseWebhook + globalConfig.endpoints.formWaiting,
        webhookBaseUrl: urlBaseWebhook + globalConfig.endpoints.webhook,
        webhookWaitingBaseUrl: urlBaseWebhook + globalConfig.endpoints.webhookWaiting,
        webhookTestBaseUrl: urlBaseWebhook + globalConfig.endpoints.webhookTest,
        currentNodeParameters,
        executionTimeoutTimestamp,
        userId,
        setExecutionStatus,
        variables,
        secretsHelpers: typedi_1.Container.get(secrets_helpers_1.SecretsHelper),
        async startAgentJob(additionalData, jobType, settings, executeFunctions, inputData, node, workflow, runExecutionData, runIndex, itemIndex, activeNodeName, connectionInputData, siblingParameters, mode, envProviderState, executeData, defaultReturnRunIndex, selfData, contextNodeName) {
            return await typedi_1.Container.get(task_manager_1.TaskManager).startTask(additionalData, jobType, settings, executeFunctions, inputData, node, workflow, runExecutionData, runIndex, itemIndex, activeNodeName, connectionInputData, siblingParameters, mode, envProviderState, executeData, defaultReturnRunIndex, selfData, contextNodeName);
        },
        logAiEvent: (eventName, payload) => eventService.emit(eventName, payload),
    };
}
function getWorkflowHooksIntegrated(mode, executionId, workflowData) {
    const hookFunctions = hookFunctionsSave();
    const preExecuteFunctions = hookFunctionsPreExecute();
    for (const key of Object.keys(preExecuteFunctions)) {
        const hooks = hookFunctions[key] ?? [];
        hooks.push.apply(hookFunctions[key], preExecuteFunctions[key]);
    }
    return new n8n_workflow_1.WorkflowHooks(hookFunctions, mode, executionId, workflowData);
}
function getWorkflowHooksWorkerExecuter(mode, executionId, workflowData, optionalParameters) {
    optionalParameters = optionalParameters || {};
    const hookFunctions = hookFunctionsSaveWorker();
    const preExecuteFunctions = hookFunctionsPreExecute();
    for (const key of Object.keys(preExecuteFunctions)) {
        const hooks = hookFunctions[key] ?? [];
        hooks.push.apply(hookFunctions[key], preExecuteFunctions[key]);
    }
    return new n8n_workflow_1.WorkflowHooks(hookFunctions, mode, executionId, workflowData, optionalParameters);
}
function getWorkflowHooksWorkerMain(mode, executionId, workflowData, optionalParameters) {
    optionalParameters = optionalParameters || {};
    const hookFunctions = hookFunctionsPreExecute();
    hookFunctions.nodeExecuteBefore = [];
    hookFunctions.nodeExecuteAfter = [];
    hookFunctions.workflowExecuteAfter = [
        async function (fullRunData) {
            if (!fullRunData.finished)
                return;
            const executionStatus = (0, shared_hook_functions_1.determineFinalExecutionStatus)(fullRunData);
            fullRunData.status = executionStatus;
            const saveSettings = (0, to_save_settings_1.toSaveSettings)(this.workflowData.settings);
            const shouldNotSave = (executionStatus === 'success' && !saveSettings.success) ||
                (executionStatus !== 'success' && !saveSettings.error);
            if (shouldNotSave) {
                await typedi_1.Container.get(execution_repository_1.ExecutionRepository).hardDelete({
                    workflowId: this.workflowData.id,
                    executionId: this.executionId,
                });
            }
        },
    ];
    return new n8n_workflow_1.WorkflowHooks(hookFunctions, mode, executionId, workflowData, optionalParameters);
}
function getWorkflowHooksMain(data, executionId) {
    const hookFunctions = hookFunctionsSave();
    const pushFunctions = hookFunctionsPush();
    for (const key of Object.keys(pushFunctions)) {
        const hooks = hookFunctions[key] ?? [];
        hooks.push.apply(hookFunctions[key], pushFunctions[key]);
    }
    const preExecuteFunctions = hookFunctionsPreExecute();
    for (const key of Object.keys(preExecuteFunctions)) {
        const hooks = hookFunctions[key] ?? [];
        hooks.push.apply(hookFunctions[key], preExecuteFunctions[key]);
    }
    if (!hookFunctions.nodeExecuteBefore)
        hookFunctions.nodeExecuteBefore = [];
    if (!hookFunctions.nodeExecuteAfter)
        hookFunctions.nodeExecuteAfter = [];
    return new n8n_workflow_1.WorkflowHooks(hookFunctions, data.executionMode, executionId, data.workflowData, {
        pushRef: data.pushRef,
        retryOf: data.retryOf,
    });
}
//# sourceMappingURL=workflow-execute-additional-data.js.map