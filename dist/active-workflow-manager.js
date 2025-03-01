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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActiveWorkflowManager = void 0;
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const typedi_1 = require("typedi");
const activation_errors_service_1 = require("./activation-errors.service");
const active_executions_1 = require("./active-executions");
const constants_1 = require("./constants");
const workflow_repository_1 = require("./databases/repositories/workflow.repository");
const on_shutdown_1 = require("./decorators/on-shutdown");
const external_hooks_1 = require("./external-hooks");
const logger_service_1 = require("./logging/logger.service");
const node_types_1 = require("./node-types");
const active_workflows_service_1 = require("./services/active-workflows.service");
const orchestration_service_1 = require("./services/orchestration.service");
const WebhookHelpers = __importStar(require("./webhooks/webhook-helpers"));
const webhook_service_1 = require("./webhooks/webhook.service");
const WorkflowExecuteAdditionalData = __importStar(require("./workflow-execute-additional-data"));
const workflow_execution_service_1 = require("./workflows/workflow-execution.service");
const workflow_static_data_service_1 = require("./workflows/workflow-static-data.service");
const execution_service_1 = require("./executions/execution.service");
const publisher_service_1 = require("./scaling/pubsub/publisher.service");
let ActiveWorkflowManager = class ActiveWorkflowManager {
    constructor(logger, activeWorkflows, activeExecutions, externalHooks, nodeTypes, webhookService, workflowRepository, orchestrationService, activationErrorsService, executionService, workflowStaticDataService, activeWorkflowsService, workflowExecutionService, instanceSettings, publisher) {
        this.logger = logger;
        this.activeWorkflows = activeWorkflows;
        this.activeExecutions = activeExecutions;
        this.externalHooks = externalHooks;
        this.nodeTypes = nodeTypes;
        this.webhookService = webhookService;
        this.workflowRepository = workflowRepository;
        this.orchestrationService = orchestrationService;
        this.activationErrorsService = activationErrorsService;
        this.executionService = executionService;
        this.workflowStaticDataService = workflowStaticDataService;
        this.activeWorkflowsService = activeWorkflowsService;
        this.workflowExecutionService = workflowExecutionService;
        this.instanceSettings = instanceSettings;
        this.publisher = publisher;
        this.queuedActivations = {};
    }
    async init() {
        await this.orchestrationService.init();
        await this.addActiveWorkflows('init');
        await this.externalHooks.run('activeWorkflows.initialized', []);
        await this.webhookService.populateCache();
    }
    async getAllWorkflowActivationErrors() {
        return await this.activationErrorsService.getAll();
    }
    async removeAll() {
        let activeWorkflowIds = [];
        this.logger.debug('Call to remove all active workflows received (removeAll)');
        activeWorkflowIds.push(...this.activeWorkflows.allActiveWorkflows());
        const activeWorkflows = await this.activeWorkflowsService.getAllActiveIdsInStorage();
        activeWorkflowIds = [...activeWorkflowIds, ...activeWorkflows];
        activeWorkflowIds = Array.from(new Set(activeWorkflowIds));
        const removePromises = [];
        for (const workflowId of activeWorkflowIds) {
            removePromises.push(this.remove(workflowId));
        }
        await Promise.all(removePromises);
    }
    allActiveInMemory() {
        return this.activeWorkflows.allActiveWorkflows();
    }
    async isActive(workflowId) {
        const workflow = await this.workflowRepository.findOne({
            select: ['active'],
            where: { id: workflowId },
        });
        return !!workflow?.active;
    }
    async addWebhooks(workflow, additionalData, mode, activation) {
        const webhooks = WebhookHelpers.getWorkflowWebhooks(workflow, additionalData, undefined, true);
        let path = '';
        if (webhooks.length === 0)
            return;
        this.logger.debug(`Adding webhooks for workflow "${workflow.name}" (ID ${workflow.id})`);
        for (const webhookData of webhooks) {
            const node = workflow.getNode(webhookData.node);
            node.name = webhookData.node;
            path = webhookData.path;
            const webhook = this.webhookService.createWebhook({
                workflowId: webhookData.workflowId,
                webhookPath: path,
                node: node.name,
                method: webhookData.httpMethod,
            });
            if (webhook.webhookPath.startsWith('/')) {
                webhook.webhookPath = webhook.webhookPath.slice(1);
            }
            if (webhook.webhookPath.endsWith('/')) {
                webhook.webhookPath = webhook.webhookPath.slice(0, -1);
            }
            if ((path.startsWith(':') || path.includes('/:')) && node.webhookId) {
                webhook.webhookId = node.webhookId;
                webhook.pathLength = webhook.webhookPath.split('/').length;
            }
            try {
                await this.webhookService.storeWebhook(webhook);
                await workflow.createWebhookIfNotExists(webhookData, n8n_core_1.NodeExecuteFunctions, mode, activation);
            }
            catch (error) {
                if (activation === 'init' && error.name === 'QueryFailedError') {
                    continue;
                }
                try {
                    await this.clearWebhooks(workflow.id);
                }
                catch (error1) {
                    n8n_workflow_1.ErrorReporterProxy.error(error1);
                    this.logger.error(`Could not remove webhooks of workflow "${workflow.id}" because of error: "${error1.message}"`);
                }
                if (error instanceof Error && error.name === 'QueryFailedError') {
                    error = new n8n_workflow_1.WebhookPathTakenError(webhook.node, error);
                }
                else if (error.detail) {
                    error.message = error.detail;
                }
                throw error;
            }
        }
        await this.webhookService.populateCache();
        await this.workflowStaticDataService.saveStaticData(workflow);
    }
    async clearWebhooks(workflowId) {
        const workflowData = await this.workflowRepository.findOne({
            where: { id: workflowId },
        });
        if (workflowData === null) {
            throw new n8n_workflow_1.ApplicationError('Could not find workflow', { extra: { workflowId } });
        }
        const workflow = new n8n_workflow_1.Workflow({
            id: workflowId,
            name: workflowData.name,
            nodes: workflowData.nodes,
            connections: workflowData.connections,
            active: workflowData.active,
            nodeTypes: this.nodeTypes,
            staticData: workflowData.staticData,
            settings: workflowData.settings,
        });
        const mode = 'internal';
        const additionalData = await WorkflowExecuteAdditionalData.getBase();
        const webhooks = WebhookHelpers.getWorkflowWebhooks(workflow, additionalData, undefined, true);
        for (const webhookData of webhooks) {
            await workflow.deleteWebhook(webhookData, n8n_core_1.NodeExecuteFunctions, mode, 'update');
        }
        await this.workflowStaticDataService.saveStaticData(workflow);
        await this.webhookService.deleteWorkflowWebhooks(workflowId);
    }
    getExecutePollFunctions(workflowData, additionalData, mode, activation) {
        return (workflow, node) => {
            const __emit = (data, responsePromise, donePromise) => {
                this.logger.debug(`Received event to trigger execution for workflow "${workflow.name}"`);
                void this.workflowStaticDataService.saveStaticData(workflow);
                const executePromise = this.workflowExecutionService.runWorkflow(workflowData, node, data, additionalData, mode, responsePromise);
                if (donePromise) {
                    void executePromise.then((executionId) => {
                        this.activeExecutions
                            .getPostExecutePromise(executionId)
                            .then(donePromise.resolve)
                            .catch(donePromise.reject);
                    });
                }
                else {
                    void executePromise.catch((error) => this.logger.error(error.message, { error }));
                }
            };
            const __emitError = (error) => {
                void this.executionService
                    .createErrorExecution(error, node, workflowData, workflow, mode)
                    .then(() => {
                    this.executeErrorWorkflow(error, workflowData, mode);
                });
            };
            return new n8n_core_1.PollContext(workflow, node, additionalData, mode, activation, __emit, __emitError);
        };
    }
    getExecuteTriggerFunctions(workflowData, additionalData, mode, activation) {
        return (workflow, node) => {
            const emit = (data, responsePromise, donePromise) => {
                this.logger.debug(`Received trigger for workflow "${workflow.name}"`);
                void this.workflowStaticDataService.saveStaticData(workflow);
                const executePromise = this.workflowExecutionService.runWorkflow(workflowData, node, data, additionalData, mode, responsePromise);
                if (donePromise) {
                    void executePromise.then((executionId) => {
                        this.activeExecutions
                            .getPostExecutePromise(executionId)
                            .then(donePromise.resolve)
                            .catch(donePromise.reject);
                    });
                }
                else {
                    executePromise.catch((error) => this.logger.error(error.message, { error }));
                }
            };
            const emitError = (error) => {
                this.logger.info(`The trigger node "${node.name}" of workflow "${workflowData.name}" failed with the error: "${error.message}". Will try to reactivate.`, {
                    nodeName: node.name,
                    workflowId: workflowData.id,
                    workflowName: workflowData.name,
                });
                void this.activeWorkflows.remove(workflowData.id);
                void this.activationErrorsService.register(workflowData.id, error.message);
                const activationError = new n8n_workflow_1.WorkflowActivationError(`There was a problem with the trigger node "${node.name}", for that reason did the workflow had to be deactivated`, { cause: error, node });
                this.executeErrorWorkflow(activationError, workflowData, mode);
                this.addQueuedWorkflowActivation(activation, workflowData);
            };
            return new n8n_core_1.TriggerContext(workflow, node, additionalData, mode, activation, emit, emitError);
        };
    }
    executeErrorWorkflow(error, workflowData, mode) {
        const fullRunData = {
            data: {
                resultData: {
                    error,
                    runData: {},
                },
            },
            finished: false,
            mode,
            startedAt: new Date(),
            stoppedAt: new Date(),
            status: 'running',
        };
        WorkflowExecuteAdditionalData.executeErrorWorkflow(workflowData, fullRunData, mode);
    }
    async addActiveWorkflows(activationMode) {
        const dbWorkflows = await this.workflowRepository.getAllActive();
        if (dbWorkflows.length === 0)
            return;
        if (this.instanceSettings.isLeader) {
            this.logger.info(' ================================');
            this.logger.info('   Start Active Workflows:');
            this.logger.info(' ================================');
        }
        for (const dbWorkflow of dbWorkflows) {
            try {
                const wasActivated = await this.add(dbWorkflow.id, activationMode, dbWorkflow, {
                    shouldPublish: false,
                });
                if (wasActivated) {
                    this.logger.debug(`Successfully started workflow ${dbWorkflow.display()}`, {
                        workflowName: dbWorkflow.name,
                        workflowId: dbWorkflow.id,
                    });
                    this.logger.info('     => Started');
                }
            }
            catch (error) {
                n8n_workflow_1.ErrorReporterProxy.error(error);
                this.logger.info('     => ERROR: Workflow could not be activated on first try, keep on trying if not an auth issue');
                this.logger.info(`               ${error.message}`);
                this.logger.error(`Issue on initial workflow activation try of ${dbWorkflow.display()} (startup)`, {
                    workflowName: dbWorkflow.name,
                    workflowId: dbWorkflow.id,
                });
                this.executeErrorWorkflow(error, dbWorkflow, 'internal');
                if (error.message.includes('Authorization'))
                    continue;
                this.addQueuedWorkflowActivation('init', dbWorkflow);
            }
        }
        this.logger.debug('Finished activating workflows (startup)');
    }
    async clearAllActivationErrors() {
        this.logger.debug('Clearing all activation errors');
        await this.activationErrorsService.clearAll();
    }
    async addAllTriggerAndPollerBasedWorkflows() {
        this.logger.debug('Adding all trigger- and poller-based workflows');
        await this.addActiveWorkflows('leadershipChange');
    }
    async removeAllTriggerAndPollerBasedWorkflows() {
        this.logger.debug('Removing all trigger- and poller-based workflows');
        await this.activeWorkflows.removeAllTriggerAndPollerBasedWorkflows();
    }
    async add(workflowId, activationMode, existingWorkflow, { shouldPublish } = { shouldPublish: true }) {
        if (this.orchestrationService.isMultiMainSetupEnabled && shouldPublish) {
            void this.publisher.publishCommand({
                command: 'add-webhooks-triggers-and-pollers',
                payload: { workflowId },
            });
            return;
        }
        let workflow;
        const shouldAddWebhooks = this.shouldAddWebhooks(activationMode);
        const shouldAddTriggersAndPollers = this.shouldAddTriggersAndPollers();
        const shouldDisplayActivationMessage = (shouldAddWebhooks || shouldAddTriggersAndPollers) &&
            ['init', 'leadershipChange'].includes(activationMode);
        try {
            const dbWorkflow = existingWorkflow ?? (await this.workflowRepository.findById(workflowId));
            if (!dbWorkflow) {
                throw new n8n_workflow_1.WorkflowActivationError(`Failed to find workflow with ID "${workflowId}"`, {
                    level: 'warning',
                });
            }
            if (shouldDisplayActivationMessage) {
                this.logger.info(`   - ${dbWorkflow.display()}`);
                this.logger.debug(`Initializing active workflow ${dbWorkflow.display()} (startup)`, {
                    workflowName: dbWorkflow.name,
                    workflowId: dbWorkflow.id,
                });
            }
            workflow = new n8n_workflow_1.Workflow({
                id: dbWorkflow.id,
                name: dbWorkflow.name,
                nodes: dbWorkflow.nodes,
                connections: dbWorkflow.connections,
                active: dbWorkflow.active,
                nodeTypes: this.nodeTypes,
                staticData: dbWorkflow.staticData,
                settings: dbWorkflow.settings,
            });
            const canBeActivated = workflow.checkIfWorkflowCanBeActivated(constants_1.STARTING_NODES);
            if (!canBeActivated) {
                throw new n8n_workflow_1.WorkflowActivationError(`Workflow ${dbWorkflow.display()} has no node to start the workflow - at least one trigger, poller or webhook node is required`, { level: 'warning' });
            }
            const additionalData = await WorkflowExecuteAdditionalData.getBase();
            if (shouldAddWebhooks) {
                await this.addWebhooks(workflow, additionalData, 'trigger', activationMode);
            }
            if (shouldAddTriggersAndPollers) {
                await this.addTriggersAndPollers(dbWorkflow, workflow, {
                    activationMode,
                    executionMode: 'trigger',
                    additionalData,
                });
            }
            this.removeQueuedWorkflowActivation(workflowId);
            await this.activationErrorsService.deregister(workflowId);
            const triggerCount = this.countTriggers(workflow, additionalData);
            await this.workflowRepository.updateWorkflowTriggerCount(workflow.id, triggerCount);
        }
        catch (e) {
            const error = e instanceof Error ? e : new Error(`${e}`);
            await this.activationErrorsService.register(workflowId, error.message);
            throw e;
        }
        await this.workflowStaticDataService.saveStaticData(workflow);
        return shouldDisplayActivationMessage;
    }
    countTriggers(workflow, additionalData) {
        const triggerFilter = (nodeType) => !!nodeType.trigger && !nodeType.description.name.includes('manualTrigger');
        return (workflow.queryNodes(triggerFilter).length +
            workflow.getPollNodes().length +
            WebhookHelpers.getWorkflowWebhooks(workflow, additionalData, undefined, true).length);
    }
    addQueuedWorkflowActivation(activationMode, workflowData) {
        const workflowId = workflowData.id;
        const workflowName = workflowData.name;
        const retryFunction = async () => {
            this.logger.info(`Try to activate workflow "${workflowName}" (${workflowId})`, {
                workflowId,
                workflowName,
            });
            try {
                await this.add(workflowId, activationMode, workflowData);
            }
            catch (error) {
                n8n_workflow_1.ErrorReporterProxy.error(error);
                let lastTimeout = this.queuedActivations[workflowId].lastTimeout;
                if (lastTimeout < constants_1.WORKFLOW_REACTIVATE_MAX_TIMEOUT) {
                    lastTimeout = Math.min(lastTimeout * 2, constants_1.WORKFLOW_REACTIVATE_MAX_TIMEOUT);
                }
                this.logger.info(` -> Activation of workflow "${workflowName}" (${workflowId}) did fail with error: "${error.message}" | retry in ${Math.floor(lastTimeout / 1000)} seconds`, {
                    workflowId,
                    workflowName,
                });
                this.queuedActivations[workflowId].lastTimeout = lastTimeout;
                this.queuedActivations[workflowId].timeout = setTimeout(retryFunction, lastTimeout);
                return;
            }
            this.logger.info(` -> Activation of workflow "${workflowName}" (${workflowId}) was successful!`, {
                workflowId,
                workflowName,
            });
        };
        this.removeQueuedWorkflowActivation(workflowId);
        this.queuedActivations[workflowId] = {
            activationMode,
            lastTimeout: constants_1.WORKFLOW_REACTIVATE_INITIAL_TIMEOUT,
            timeout: setTimeout(retryFunction, constants_1.WORKFLOW_REACTIVATE_INITIAL_TIMEOUT),
            workflowData,
        };
    }
    removeQueuedWorkflowActivation(workflowId) {
        if (this.queuedActivations[workflowId]) {
            clearTimeout(this.queuedActivations[workflowId].timeout);
            delete this.queuedActivations[workflowId];
        }
    }
    removeAllQueuedWorkflowActivations() {
        for (const workflowId in this.queuedActivations) {
            this.removeQueuedWorkflowActivation(workflowId);
        }
    }
    async remove(workflowId) {
        if (this.orchestrationService.isMultiMainSetupEnabled) {
            try {
                await this.clearWebhooks(workflowId);
            }
            catch (error) {
                n8n_workflow_1.ErrorReporterProxy.error(error);
                this.logger.error(`Could not remove webhooks of workflow "${workflowId}" because of error: "${error.message}"`);
            }
            void this.publisher.publishCommand({
                command: 'remove-triggers-and-pollers',
                payload: { workflowId },
            });
            return;
        }
        try {
            await this.clearWebhooks(workflowId);
        }
        catch (error) {
            n8n_workflow_1.ErrorReporterProxy.error(error);
            this.logger.error(`Could not remove webhooks of workflow "${workflowId}" because of error: "${error.message}"`);
        }
        await this.activationErrorsService.deregister(workflowId);
        if (this.queuedActivations[workflowId] !== undefined) {
            this.removeQueuedWorkflowActivation(workflowId);
        }
        await this.removeWorkflowTriggersAndPollers(workflowId);
    }
    async removeWorkflowTriggersAndPollers(workflowId) {
        if (!this.activeWorkflows.isActive(workflowId))
            return;
        const wasRemoved = await this.activeWorkflows.remove(workflowId);
        if (wasRemoved) {
            this.logger.debug(`Removed triggers and pollers for workflow "${workflowId}"`, {
                workflowId,
            });
        }
    }
    async addTriggersAndPollers(dbWorkflow, workflow, { activationMode, executionMode, additionalData, }) {
        const getTriggerFunctions = this.getExecuteTriggerFunctions(dbWorkflow, additionalData, executionMode, activationMode);
        const getPollFunctions = this.getExecutePollFunctions(dbWorkflow, additionalData, executionMode, activationMode);
        if (workflow.getTriggerNodes().length !== 0 || workflow.getPollNodes().length !== 0) {
            this.logger.debug(`Adding triggers and pollers for workflow ${dbWorkflow.display()}`);
            await this.activeWorkflows.add(workflow.id, workflow, additionalData, executionMode, activationMode, getTriggerFunctions, getPollFunctions);
            this.logger.debug(`Workflow ${dbWorkflow.display()} activated`, {
                workflowId: dbWorkflow.id,
                workflowName: dbWorkflow.name,
            });
        }
    }
    async removeActivationError(workflowId) {
        await this.activationErrorsService.deregister(workflowId);
    }
    shouldAddWebhooks(activationMode) {
        if (activationMode === 'init')
            return true;
        if (activationMode === 'leadershipChange')
            return false;
        return this.instanceSettings.isLeader;
    }
    shouldAddTriggersAndPollers() {
        return this.instanceSettings.isLeader;
    }
};
exports.ActiveWorkflowManager = ActiveWorkflowManager;
__decorate([
    (0, on_shutdown_1.OnShutdown)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ActiveWorkflowManager.prototype, "removeAllTriggerAndPollerBasedWorkflows", null);
exports.ActiveWorkflowManager = ActiveWorkflowManager = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [logger_service_1.Logger,
        n8n_core_1.ActiveWorkflows,
        active_executions_1.ActiveExecutions,
        external_hooks_1.ExternalHooks,
        node_types_1.NodeTypes,
        webhook_service_1.WebhookService,
        workflow_repository_1.WorkflowRepository,
        orchestration_service_1.OrchestrationService,
        activation_errors_service_1.ActivationErrorsService,
        execution_service_1.ExecutionService,
        workflow_static_data_service_1.WorkflowStaticDataService,
        active_workflows_service_1.ActiveWorkflowsService,
        workflow_execution_service_1.WorkflowExecutionService,
        n8n_core_1.InstanceSettings,
        publisher_service_1.Publisher])
], ActiveWorkflowManager);
//# sourceMappingURL=active-workflow-manager.js.map