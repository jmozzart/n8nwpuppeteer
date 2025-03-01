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
exports.WorkflowExecutionService = void 0;
const config_1 = require("@n8n/config");
const n8n_workflow_1 = require("n8n-workflow");
const typedi_1 = require("typedi");
const execution_repository_1 = require("../databases/repositories/execution.repository");
const workflow_repository_1 = require("../databases/repositories/workflow.repository");
const logger_service_1 = require("../logging/logger.service");
const node_types_1 = require("../node-types");
const subworkflow_policy_checker_service_1 = require("../subworkflows/subworkflow-policy-checker.service");
const test_webhooks_1 = require("../webhooks/test-webhooks");
const WorkflowExecuteAdditionalData = __importStar(require("../workflow-execute-additional-data"));
const WorkflowHelpers = __importStar(require("../workflow-helpers"));
const workflow_runner_1 = require("../workflow-runner");
let WorkflowExecutionService = class WorkflowExecutionService {
    constructor(logger, executionRepository, workflowRepository, nodeTypes, testWebhooks, workflowRunner, globalConfig, subworkflowPolicyChecker) {
        this.logger = logger;
        this.executionRepository = executionRepository;
        this.workflowRepository = workflowRepository;
        this.nodeTypes = nodeTypes;
        this.testWebhooks = testWebhooks;
        this.workflowRunner = workflowRunner;
        this.globalConfig = globalConfig;
        this.subworkflowPolicyChecker = subworkflowPolicyChecker;
    }
    async runWorkflow(workflowData, node, data, additionalData, mode, responsePromise) {
        const nodeExecutionStack = [
            {
                node,
                data: {
                    main: data,
                },
                source: null,
            },
        ];
        const executionData = {
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
        const runData = {
            userId: additionalData.userId,
            executionMode: mode,
            executionData,
            workflowData,
        };
        return await this.workflowRunner.run(runData, true, undefined, undefined, responsePromise);
    }
    async executeManually({ workflowData, runData, startNodes, destinationNode }, user, pushRef, partialExecutionVersion) {
        const pinData = workflowData.pinData;
        const pinnedTrigger = this.selectPinnedActivatorStarter(workflowData, startNodes?.map((nodeData) => nodeData.name), pinData);
        if (pinnedTrigger === null &&
            (runData === undefined ||
                startNodes === undefined ||
                startNodes.length === 0 ||
                destinationNode === undefined)) {
            const additionalData = await WorkflowExecuteAdditionalData.getBase(user.id);
            const needsWebhook = await this.testWebhooks.needsWebhook(user.id, workflowData, additionalData, runData, pushRef, destinationNode);
            if (needsWebhook)
                return { waitingForWebhook: true };
        }
        workflowData.active = false;
        const data = {
            destinationNode,
            executionMode: 'manual',
            runData,
            pinData,
            pushRef,
            startNodes,
            workflowData,
            userId: user.id,
            partialExecutionVersion: partialExecutionVersion ?? '0',
        };
        const hasRunData = (node) => runData !== undefined && !!runData[node.name];
        if (pinnedTrigger && !hasRunData(pinnedTrigger)) {
            data.startNodes = [{ name: pinnedTrigger.name, sourceData: null }];
        }
        const executionId = await this.workflowRunner.run(data);
        return {
            executionId,
        };
    }
    async executeErrorWorkflow(workflowId, workflowErrorData, runningProject) {
        try {
            const workflowData = await this.workflowRepository.findOneBy({ id: workflowId });
            if (workflowData === null) {
                this.logger.error(`Calling Error Workflow for "${workflowErrorData.workflow.id}". Could not find error workflow "${workflowId}"`, { workflowId });
                return;
            }
            const executionMode = 'error';
            const workflowInstance = new n8n_workflow_1.Workflow({
                id: workflowId,
                name: workflowData.name,
                nodeTypes: this.nodeTypes,
                nodes: workflowData.nodes,
                connections: workflowData.connections,
                active: workflowData.active,
                staticData: workflowData.staticData,
                settings: workflowData.settings,
            });
            try {
                const failedNode = workflowErrorData.execution?.lastNodeExecuted
                    ? workflowInstance.getNode(workflowErrorData.execution?.lastNodeExecuted)
                    : undefined;
                await this.subworkflowPolicyChecker.check(workflowInstance, workflowErrorData.workflow.id, failedNode ?? undefined);
            }
            catch (error) {
                const initialNode = workflowInstance.getStartNode();
                if (initialNode) {
                    const errorWorkflowPermissionError = new n8n_workflow_1.SubworkflowOperationError(`Another workflow: (ID ${workflowErrorData.workflow.id}) tried to invoke this workflow to handle errors.`, "Unfortunately current permissions do not allow this. Please check that this workflow's settings allow it to be called by others");
                    const fakeExecution = WorkflowHelpers.generateFailedExecutionFromError('error', errorWorkflowPermissionError, initialNode);
                    const fullExecutionData = {
                        data: fakeExecution.data,
                        mode: fakeExecution.mode,
                        finished: false,
                        stoppedAt: new Date(),
                        workflowData,
                        waitTill: null,
                        status: fakeExecution.status,
                        workflowId: workflowData.id,
                    };
                    await this.executionRepository.createNewExecution(fullExecutionData);
                }
                this.logger.info('Error workflow execution blocked due to subworkflow settings', {
                    erroredWorkflowId: workflowErrorData.workflow.id,
                    errorWorkflowId: workflowId,
                });
                return;
            }
            let node;
            let workflowStartNode;
            const { errorTriggerType } = this.globalConfig.nodes;
            for (const nodeName of Object.keys(workflowInstance.nodes)) {
                node = workflowInstance.nodes[nodeName];
                if (node.type === errorTriggerType) {
                    workflowStartNode = node;
                }
            }
            if (workflowStartNode === undefined) {
                this.logger.error(`Calling Error Workflow for "${workflowErrorData.workflow.id}". Could not find "${errorTriggerType}" in workflow "${workflowId}"`);
                return;
            }
            const nodeExecutionStack = [];
            nodeExecutionStack.push({
                node: workflowStartNode,
                data: {
                    main: [
                        [
                            {
                                json: workflowErrorData,
                            },
                        ],
                    ],
                },
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
            const runData = {
                executionMode,
                executionData: runExecutionData,
                workflowData,
                projectId: runningProject.id,
            };
            await this.workflowRunner.run(runData);
        }
        catch (error) {
            n8n_workflow_1.ErrorReporterProxy.error(error);
            this.logger.error(`Calling Error Workflow for "${workflowErrorData.workflow.id}": "${error.message}"`, { workflowId: workflowErrorData.workflow.id });
        }
    }
    selectPinnedActivatorStarter(workflow, startNodes, pinData) {
        if (!pinData || !startNodes)
            return null;
        const allPinnedActivators = this.findAllPinnedActivators(workflow, pinData);
        if (allPinnedActivators.length === 0)
            return null;
        const [firstPinnedActivator] = allPinnedActivators;
        if (startNodes?.length === 0)
            return firstPinnedActivator ?? null;
        const [firstStartNodeName] = startNodes;
        const parentNodeNames = new n8n_workflow_1.Workflow({
            nodes: workflow.nodes,
            connections: workflow.connections,
            active: workflow.active,
            nodeTypes: this.nodeTypes,
        }).getParentNodes(firstStartNodeName);
        if (parentNodeNames.length > 0) {
            const parentNodeName = parentNodeNames.find((p) => p === firstPinnedActivator.name);
            return allPinnedActivators.find((pa) => pa.name === parentNodeName) ?? null;
        }
        return allPinnedActivators.find((pa) => pa.name === firstStartNodeName) ?? null;
    }
    findAllPinnedActivators(workflow, pinData) {
        return workflow.nodes
            .filter((node) => !node.disabled &&
            pinData?.[node.name] &&
            ['trigger', 'webhook'].some((suffix) => node.type.toLowerCase().endsWith(suffix)) &&
            node.type !== 'n8n-nodes-base.respondToWebhook')
            .sort((a) => (a.type.endsWith('webhook') ? -1 : 1));
    }
};
exports.WorkflowExecutionService = WorkflowExecutionService;
exports.WorkflowExecutionService = WorkflowExecutionService = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [logger_service_1.Logger,
        execution_repository_1.ExecutionRepository,
        workflow_repository_1.WorkflowRepository,
        node_types_1.NodeTypes,
        test_webhooks_1.TestWebhooks,
        workflow_runner_1.WorkflowRunner,
        config_1.GlobalConfig,
        subworkflow_policy_checker_service_1.SubworkflowPolicyChecker])
], WorkflowExecutionService);
//# sourceMappingURL=workflow-execution.service.js.map