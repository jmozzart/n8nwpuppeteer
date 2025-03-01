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
exports.TaskManager = void 0;
const config_1 = require("@n8n/config");
const task_runner_1 = require("@n8n/task-runner");
const n8n_workflow_1 = require("n8n-workflow");
const nanoid_1 = require("nanoid");
const a = __importStar(require("node:assert/strict"));
const typedi_1 = __importStar(require("typedi"));
const node_types_1 = require("../../node-types");
const data_request_response_builder_1 = require("./data-request-response-builder");
const data_request_response_stripper_1 = require("./data-request-response-stripper");
let TaskManager = class TaskManager {
    constructor(nodeTypes) {
        this.nodeTypes = nodeTypes;
        this.requestAcceptRejects = new Map();
        this.taskAcceptRejects = new Map();
        this.pendingRequests = new Map();
        this.tasks = new Map();
        this.runnerConfig = typedi_1.default.get(config_1.TaskRunnersConfig);
        this.dataResponseBuilder = new data_request_response_builder_1.DataRequestResponseBuilder();
    }
    async startTask(additionalData, taskType, settings, executeFunctions, inputData, node, workflow, runExecutionData, runIndex, itemIndex, activeNodeName, connectionInputData, siblingParameters, mode, envProviderState, executeData, defaultReturnRunIndex = -1, selfData = {}, contextNodeName = activeNodeName) {
        const data = {
            workflow,
            runExecutionData,
            runIndex,
            connectionInputData,
            inputData,
            node,
            executeFunctions,
            itemIndex,
            siblingParameters,
            mode,
            envProviderState,
            executeData,
            defaultReturnRunIndex,
            selfData,
            contextNodeName,
            activeNodeName,
            additionalData,
        };
        const request = {
            requestId: (0, nanoid_1.nanoid)(),
            taskType,
            settings,
            data,
        };
        this.pendingRequests.set(request.requestId, request);
        const taskIdPromise = new Promise((resolve, reject) => {
            this.requestAcceptRejects.set(request.requestId, {
                accept: resolve,
                reject,
            });
        });
        this.sendMessage({
            type: 'requester:taskrequest',
            requestId: request.requestId,
            taskType,
        });
        const taskId = await taskIdPromise;
        const task = {
            taskId,
            data,
            settings,
        };
        this.tasks.set(task.taskId, task);
        try {
            const dataPromise = new Promise((resolve, reject) => {
                this.taskAcceptRejects.set(task.taskId, {
                    accept: resolve,
                    reject,
                });
            });
            this.sendMessage({
                type: 'requester:tasksettings',
                taskId,
                settings,
            });
            const resultData = await dataPromise;
            if (resultData.customData) {
                Object.entries(resultData.customData).forEach(([k, v]) => {
                    if (!runExecutionData.resultData.metadata) {
                        runExecutionData.resultData.metadata = {};
                    }
                    runExecutionData.resultData.metadata[k] = v;
                });
            }
            return (0, n8n_workflow_1.createResultOk)(resultData.result);
        }
        catch (e) {
            return (0, n8n_workflow_1.createResultError)(e);
        }
        finally {
            this.tasks.delete(taskId);
        }
    }
    sendMessage(_message) { }
    onMessage(message) {
        switch (message.type) {
            case 'broker:taskready':
                this.taskReady(message.requestId, message.taskId);
                break;
            case 'broker:taskdone':
                this.taskDone(message.taskId, message.data);
                break;
            case 'broker:taskerror':
                this.taskError(message.taskId, message.error);
                break;
            case 'broker:taskdatarequest':
                this.sendTaskData(message.taskId, message.requestId, message.requestParams);
                break;
            case 'broker:nodetypesrequest':
                this.sendNodeTypes(message.taskId, message.requestId, message.requestParams);
                break;
            case 'broker:rpc':
                void this.handleRpc(message.taskId, message.callId, message.name, message.params);
                break;
        }
    }
    taskReady(requestId, taskId) {
        const acceptReject = this.requestAcceptRejects.get(requestId);
        if (!acceptReject) {
            this.rejectTask(taskId, 'Request ID not found. In multi-main setup, it is possible for one of the mains to have reported ready state already.');
            return;
        }
        acceptReject.accept(taskId);
        this.requestAcceptRejects.delete(requestId);
    }
    rejectTask(jobId, reason) {
        this.sendMessage({
            type: 'requester:taskcancel',
            taskId: jobId,
            reason,
        });
    }
    taskDone(taskId, data) {
        const acceptReject = this.taskAcceptRejects.get(taskId);
        if (acceptReject) {
            acceptReject.accept(data);
            this.taskAcceptRejects.delete(taskId);
        }
    }
    taskError(taskId, error) {
        const acceptReject = this.taskAcceptRejects.get(taskId);
        if (acceptReject) {
            acceptReject.reject(error);
            this.taskAcceptRejects.delete(taskId);
        }
    }
    sendTaskData(taskId, requestId, requestParams) {
        const job = this.tasks.get(taskId);
        if (!job) {
            return;
        }
        const dataRequestResponse = this.dataResponseBuilder.buildFromTaskData(job.data);
        if (this.runnerConfig.assertDeduplicationOutput) {
            const reconstruct = new task_runner_1.DataRequestResponseReconstruct();
            a.deepStrictEqual(reconstruct.reconstructConnectionInputData(dataRequestResponse.inputData), job.data.connectionInputData);
            a.deepStrictEqual(reconstruct.reconstructExecuteData(dataRequestResponse), job.data.executeData);
        }
        const strippedData = new data_request_response_stripper_1.DataRequestResponseStripper(dataRequestResponse, requestParams).strip();
        this.sendMessage({
            type: 'requester:taskdataresponse',
            taskId,
            requestId,
            data: strippedData,
        });
    }
    sendNodeTypes(taskId, requestId, neededNodeTypes) {
        const nodeTypes = this.nodeTypes.getNodeTypeDescriptions(neededNodeTypes);
        this.sendMessage({
            type: 'requester:nodetypesresponse',
            taskId,
            requestId,
            nodeTypes,
        });
    }
    async handleRpc(taskId, callId, name, params) {
        const job = this.tasks.get(taskId);
        if (!job) {
            return;
        }
        try {
            if (!task_runner_1.RPC_ALLOW_LIST.includes(name)) {
                this.sendMessage({
                    type: 'requester:rpcresponse',
                    taskId,
                    callId,
                    status: 'error',
                    data: 'Method not allowed',
                });
                return;
            }
            const splitPath = name.split('.');
            const funcs = job.data.executeFunctions;
            let func = undefined;
            let funcObj = funcs;
            for (const part of splitPath) {
                funcObj = funcObj[part] ?? undefined;
                if (!funcObj) {
                    break;
                }
            }
            func = funcObj;
            if (!func) {
                this.sendMessage({
                    type: 'requester:rpcresponse',
                    taskId,
                    callId,
                    status: 'error',
                    data: 'Could not find method',
                });
                return;
            }
            const data = (await func.call(funcs, ...params));
            this.sendMessage({
                type: 'requester:rpcresponse',
                taskId,
                callId,
                status: 'success',
                data,
            });
        }
        catch (e) {
            this.sendMessage({
                type: 'requester:rpcresponse',
                taskId,
                callId,
                status: 'error',
                data: e,
            });
        }
    }
};
exports.TaskManager = TaskManager;
exports.TaskManager = TaskManager = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [node_types_1.NodeTypes])
], TaskManager);
//# sourceMappingURL=task-manager.js.map