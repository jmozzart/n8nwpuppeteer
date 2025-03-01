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
exports.getWorkflowWebhooks = getWorkflowWebhooks;
exports.executeWebhook = executeWebhook;
const config_1 = require("@n8n/config");
const get_1 = __importDefault(require("lodash/get"));
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const promises_1 = require("stream/promises");
const typedi_1 = require("typedi");
const active_executions_1 = require("../active-executions");
const internal_server_error_1 = require("../errors/response-errors/internal-server.error");
const not_found_error_1 = require("../errors/response-errors/not-found.error");
const unprocessable_error_1 = require("../errors/response-errors/unprocessable.error");
const logger_service_1 = require("../logging/logger.service");
const middlewares_1 = require("../middlewares");
const ownership_service_1 = require("../services/ownership.service");
const workflow_statistics_service_1 = require("../services/workflow-statistics.service");
const webhook_form_data_1 = require("../webhooks/webhook-form-data");
const WorkflowExecuteAdditionalData = __importStar(require("../workflow-execute-additional-data"));
const WorkflowHelpers = __importStar(require("../workflow-helpers"));
const workflow_runner_1 = require("../workflow-runner");
function getWorkflowWebhooks(workflow, additionalData, destinationNode, ignoreRestartWebhooks = false) {
    const returnData = [];
    let parentNodes;
    if (destinationNode !== undefined) {
        parentNodes = workflow.getParentNodes(destinationNode);
        parentNodes.push(destinationNode);
    }
    for (const node of Object.values(workflow.nodes)) {
        if (parentNodes !== undefined && !parentNodes.includes(node.name)) {
            continue;
        }
        returnData.push.apply(returnData, n8n_workflow_1.NodeHelpers.getNodeWebhooks(workflow, node, additionalData, ignoreRestartWebhooks));
    }
    return returnData;
}
const { formDataFileSizeMax } = typedi_1.Container.get(config_1.GlobalConfig).endpoints;
const parseFormData = (0, webhook_form_data_1.createMultiFormDataParser)(formDataFileSizeMax);
async function executeWebhook(workflow, webhookData, workflowData, workflowStartNode, executionMode, pushRef, runExecutionData, executionId, req, res, responseCallback, destinationNode) {
    const nodeType = workflow.nodeTypes.getByNameAndVersion(workflowStartNode.type, workflowStartNode.typeVersion);
    if (nodeType === undefined) {
        const errorMessage = `The type of the webhook node "${workflowStartNode.name}" is not known`;
        responseCallback(new n8n_workflow_1.ApplicationError(errorMessage), {});
        throw new internal_server_error_1.InternalServerError(errorMessage);
    }
    const additionalKeys = {
        $executionId: executionId,
    };
    let project = undefined;
    try {
        project = await typedi_1.Container.get(ownership_service_1.OwnershipService).getWorkflowProjectCached(workflowData.id);
    }
    catch (error) {
        throw new not_found_error_1.NotFoundError('Cannot find workflow');
    }
    const additionalData = await WorkflowExecuteAdditionalData.getBase();
    if (executionId) {
        additionalData.executionId = executionId;
    }
    let responseMode;
    if (nodeType.description.name === 'formTrigger') {
        const connectedNodes = workflow.getChildNodes(workflowStartNode.name);
        let hasNextPage = false;
        for (const nodeName of connectedNodes) {
            const node = workflow.nodes[nodeName];
            if (node.type === n8n_workflow_1.FORM_NODE_TYPE && !node.disabled) {
                hasNextPage = true;
                break;
            }
        }
        if (hasNextPage) {
            responseMode = 'formPage';
        }
    }
    if (!responseMode) {
        responseMode = workflow.expression.getSimpleParameterValue(workflowStartNode, webhookData.webhookDescription.responseMode, executionMode, additionalKeys, undefined, 'onReceived');
    }
    const responseCode = workflow.expression.getSimpleParameterValue(workflowStartNode, webhookData.webhookDescription.responseCode, executionMode, additionalKeys, undefined, 200);
    const responseData = workflow.expression.getComplexParameterValue(workflowStartNode, webhookData.webhookDescription.responseData, executionMode, additionalKeys, undefined, 'firstEntryJson');
    if (!['onReceived', 'lastNode', 'responseNode', 'formPage'].includes(responseMode)) {
        const errorMessage = `The response mode '${responseMode}' is not valid!`;
        responseCallback(new n8n_workflow_1.ApplicationError(errorMessage), {});
        throw new internal_server_error_1.InternalServerError(errorMessage);
    }
    additionalData.httpRequest = req;
    additionalData.httpResponse = res;
    let binaryData;
    const nodeVersion = workflowStartNode.typeVersion;
    if (nodeVersion === 1) {
        binaryData = workflow.expression.getSimpleParameterValue(workflowStartNode, '={{$parameter["options"]["binaryData"]}}', executionMode, additionalKeys, undefined, false);
    }
    let didSendResponse = false;
    let runExecutionDataMerge = {};
    try {
        let webhookResultData;
        if (!binaryData) {
            const { contentType } = req;
            if (contentType === 'multipart/form-data') {
                req.body = await parseFormData(req);
            }
            else {
                if (nodeVersion > 1) {
                    if (contentType?.startsWith('application/json') ||
                        contentType?.startsWith('text/plain') ||
                        contentType?.startsWith('application/x-www-form-urlencoded') ||
                        contentType?.endsWith('/xml') ||
                        contentType?.endsWith('+xml')) {
                        await (0, middlewares_1.parseBody)(req);
                    }
                }
                else {
                    await (0, middlewares_1.parseBody)(req);
                }
            }
        }
        try {
            webhookResultData = await workflow.runWebhook(webhookData, workflowStartNode, additionalData, n8n_core_1.NodeExecuteFunctions, executionMode, runExecutionData ?? null);
            typedi_1.Container.get(workflow_statistics_service_1.WorkflowStatisticsService).emit('nodeFetchedData', {
                workflowId: workflow.id,
                node: workflowStartNode,
            });
        }
        catch (err) {
            const webhookType = ['formTrigger', 'form'].includes(nodeType.description.name)
                ? 'Form'
                : 'Webhook';
            let errorMessage = `Workflow ${webhookType} Error: Workflow could not be started!`;
            if (err instanceof n8n_workflow_1.NodeOperationError && err.type === 'manual-form-test') {
                errorMessage = err.message;
            }
            n8n_workflow_1.ErrorReporterProxy.error(err, {
                extra: {
                    nodeName: workflowStartNode.name,
                    nodeType: workflowStartNode.type,
                    nodeVersion: workflowStartNode.typeVersion,
                    workflowId: workflow.id,
                },
            });
            responseCallback(new n8n_workflow_1.ApplicationError(errorMessage), {});
            didSendResponse = true;
            runExecutionDataMerge = {
                resultData: {
                    runData: {},
                    lastNodeExecuted: workflowStartNode.name,
                    error: {
                        ...err,
                        message: err.message,
                        stack: err.stack,
                    },
                },
            };
            webhookResultData = {
                noWebhookResponse: true,
                workflowData: [[{ json: {} }]],
            };
        }
        const additionalKeys = {
            $executionId: executionId,
        };
        if (webhookData.webhookDescription.responseHeaders !== undefined) {
            const responseHeaders = workflow.expression.getComplexParameterValue(workflowStartNode, webhookData.webhookDescription.responseHeaders, executionMode, additionalKeys, undefined, undefined);
            if (responseHeaders !== undefined && responseHeaders.entries !== undefined) {
                for (const item of responseHeaders.entries) {
                    res.setHeader(item.name, item.value);
                }
            }
        }
        if (webhookResultData.noWebhookResponse === true && !didSendResponse) {
            responseCallback(null, {
                noWebhookResponse: true,
            });
            didSendResponse = true;
        }
        if (webhookResultData.workflowData === undefined) {
            if (webhookResultData.webhookResponse !== undefined) {
                if (!didSendResponse) {
                    responseCallback(null, {
                        data: webhookResultData.webhookResponse,
                        responseCode,
                    });
                    didSendResponse = true;
                }
            }
            else {
                if (!didSendResponse) {
                    responseCallback(null, {
                        data: {
                            message: 'Webhook call received',
                        },
                        responseCode,
                    });
                    didSendResponse = true;
                }
            }
            return;
        }
        if (responseMode === 'onReceived' && !didSendResponse) {
            if (responseData === 'noData') {
                responseCallback(null, {
                    responseCode,
                });
            }
            else if (responseData) {
                responseCallback(null, {
                    data: responseData,
                    responseCode,
                });
            }
            else if (webhookResultData.webhookResponse !== undefined) {
                responseCallback(null, {
                    data: webhookResultData.webhookResponse,
                    responseCode,
                });
            }
            else {
                responseCallback(null, {
                    data: {
                        message: 'Workflow was started',
                    },
                    responseCode,
                });
            }
            didSendResponse = true;
        }
        const nodeExecutionStack = [];
        nodeExecutionStack.push({
            node: workflowStartNode,
            data: {
                main: webhookResultData.workflowData,
            },
            source: null,
        });
        runExecutionData =
            runExecutionData ||
                {
                    startData: {},
                    resultData: {
                        runData: {},
                    },
                    executionData: {
                        contextData: {},
                        nodeExecutionStack,
                        waitingExecution: {},
                    },
                };
        if (destinationNode && runExecutionData.startData) {
            runExecutionData.startData.destinationNode = destinationNode;
        }
        if (executionId !== undefined) {
            runExecutionData.executionData.nodeExecutionStack[0].data.main =
                webhookResultData.workflowData;
        }
        if (Object.keys(runExecutionDataMerge).length !== 0) {
            Object.assign(runExecutionData, runExecutionDataMerge);
        }
        let pinData;
        const usePinData = executionMode === 'manual';
        if (usePinData) {
            pinData = workflowData.pinData;
            runExecutionData.resultData.pinData = pinData;
        }
        const runData = {
            executionMode,
            executionData: runExecutionData,
            pushRef,
            workflowData,
            pinData,
            projectId: project?.id,
        };
        if (!runData.pushRef) {
            runData.pushRef = runExecutionData.pushRef;
        }
        let responsePromise;
        if (responseMode === 'responseNode') {
            responsePromise = (0, n8n_workflow_1.createDeferredPromise)();
            responsePromise.promise
                .then(async (response) => {
                if (didSendResponse) {
                    return;
                }
                const binaryData = response.body?.binaryData;
                if (binaryData?.id) {
                    res.header(response.headers);
                    const stream = await typedi_1.Container.get(n8n_core_1.BinaryDataService).getAsStream(binaryData.id);
                    stream.pipe(res, { end: false });
                    await (0, promises_1.finished)(stream);
                    responseCallback(null, { noWebhookResponse: true });
                }
                else if (Buffer.isBuffer(response.body)) {
                    res.header(response.headers);
                    res.end(response.body);
                    responseCallback(null, { noWebhookResponse: true });
                }
                else {
                    const headers = response.headers;
                    let responseCode = response.statusCode;
                    let data = response.body;
                    if (nodeType.description.name === 'formTrigger' &&
                        headers.location &&
                        String(responseCode).startsWith('3')) {
                        responseCode = 200;
                        data = {
                            redirectURL: headers.location,
                        };
                        headers.location = undefined;
                    }
                    responseCallback(null, {
                        data,
                        headers,
                        responseCode,
                    });
                }
                process.nextTick(() => res.end());
                didSendResponse = true;
            })
                .catch(async (error) => {
                n8n_workflow_1.ErrorReporterProxy.error(error);
                typedi_1.Container.get(logger_service_1.Logger).error(`Error with Webhook-Response for execution "${executionId}": "${error.message}"`, { executionId, workflowId: workflow.id });
            });
        }
        executionId = await typedi_1.Container.get(workflow_runner_1.WorkflowRunner).run(runData, true, !didSendResponse, executionId, responsePromise);
        if (responseMode === 'formPage' && !didSendResponse) {
            res.redirect(`${additionalData.formWaitingBaseUrl}/${executionId}`);
            process.nextTick(() => res.end());
            didSendResponse = true;
        }
        typedi_1.Container.get(logger_service_1.Logger).debug(`Started execution of workflow "${workflow.name}" from webhook with execution ID ${executionId}`, { executionId });
        if (!didSendResponse) {
            const executePromise = typedi_1.Container.get(active_executions_1.ActiveExecutions).getPostExecutePromise(executionId);
            executePromise
                .then(async (data) => {
                if (data === undefined) {
                    if (!didSendResponse) {
                        responseCallback(null, {
                            data: {
                                message: 'Workflow executed successfully but no data was returned',
                            },
                            responseCode,
                        });
                        didSendResponse = true;
                    }
                    return undefined;
                }
                if (usePinData) {
                    data.data.resultData.pinData = pinData;
                }
                const returnData = WorkflowHelpers.getDataLastExecutedNodeData(data);
                if (data.data.resultData.error || returnData?.error !== undefined) {
                    if (!didSendResponse) {
                        responseCallback(null, {
                            data: {
                                message: 'Error in workflow',
                            },
                            responseCode: 500,
                        });
                    }
                    didSendResponse = true;
                    return data;
                }
                if (responseMode === 'responseNode' && responsePromise) {
                    await Promise.allSettled([responsePromise.promise]);
                    return undefined;
                }
                if (returnData === undefined) {
                    if (!didSendResponse) {
                        responseCallback(null, {
                            data: {
                                message: 'Workflow executed successfully but the last node did not return any data',
                            },
                            responseCode,
                        });
                    }
                    didSendResponse = true;
                    return data;
                }
                const additionalKeys = {
                    $executionId: executionId,
                };
                if (!didSendResponse) {
                    let data;
                    if (responseData === 'firstEntryJson') {
                        if (returnData.data.main[0][0] === undefined) {
                            responseCallback(new n8n_workflow_1.ApplicationError('No item to return got found'), {});
                            didSendResponse = true;
                            return undefined;
                        }
                        data = returnData.data.main[0][0].json;
                        const responsePropertyName = workflow.expression.getSimpleParameterValue(workflowStartNode, webhookData.webhookDescription.responsePropertyName, executionMode, additionalKeys, undefined, undefined);
                        if (responsePropertyName !== undefined) {
                            data = (0, get_1.default)(data, responsePropertyName);
                        }
                        const responseContentType = workflow.expression.getSimpleParameterValue(workflowStartNode, webhookData.webhookDescription.responseContentType, executionMode, additionalKeys, undefined, undefined);
                        if (responseContentType !== undefined) {
                            res.setHeader('Content-Type', responseContentType);
                            if (data !== null &&
                                data !== undefined &&
                                ['Buffer', 'String'].includes(data.constructor.name)) {
                                res.end(data);
                            }
                            else {
                                res.end(JSON.stringify(data));
                            }
                            responseCallback(null, {
                                noWebhookResponse: true,
                            });
                            didSendResponse = true;
                        }
                    }
                    else if (responseData === 'firstEntryBinary') {
                        data = returnData.data.main[0][0];
                        if (data === undefined) {
                            responseCallback(new n8n_workflow_1.ApplicationError('No item was found to return'), {});
                            didSendResponse = true;
                            return undefined;
                        }
                        if (data.binary === undefined) {
                            responseCallback(new n8n_workflow_1.ApplicationError('No binary data was found to return'), {});
                            didSendResponse = true;
                            return undefined;
                        }
                        const responseBinaryPropertyName = workflow.expression.getSimpleParameterValue(workflowStartNode, webhookData.webhookDescription.responseBinaryPropertyName, executionMode, additionalKeys, undefined, 'data');
                        if (responseBinaryPropertyName === undefined && !didSendResponse) {
                            responseCallback(new n8n_workflow_1.ApplicationError("No 'responseBinaryPropertyName' is set"), {});
                            didSendResponse = true;
                        }
                        const binaryData = data.binary[responseBinaryPropertyName];
                        if (binaryData === undefined && !didSendResponse) {
                            responseCallback(new n8n_workflow_1.ApplicationError(`The binary property '${responseBinaryPropertyName}' which should be returned does not exist`), {});
                            didSendResponse = true;
                        }
                        if (!didSendResponse) {
                            res.setHeader('Content-Type', binaryData.mimeType);
                            if (binaryData.id) {
                                const stream = await typedi_1.Container.get(n8n_core_1.BinaryDataService).getAsStream(binaryData.id);
                                stream.pipe(res, { end: false });
                                await (0, promises_1.finished)(stream);
                            }
                            else {
                                res.write(Buffer.from(binaryData.data, n8n_workflow_1.BINARY_ENCODING));
                            }
                            responseCallback(null, {
                                noWebhookResponse: true,
                            });
                            process.nextTick(() => res.end());
                        }
                    }
                    else if (responseData === 'noData') {
                        data = undefined;
                    }
                    else {
                        data = [];
                        for (const entry of returnData.data.main[0]) {
                            data.push(entry.json);
                        }
                    }
                    if (!didSendResponse) {
                        responseCallback(null, {
                            data,
                            responseCode,
                        });
                    }
                }
                didSendResponse = true;
                return data;
            })
                .catch((e) => {
                if (!didSendResponse) {
                    responseCallback(new n8n_workflow_1.ApplicationError('There was a problem executing the workflow', {
                        level: 'warning',
                        cause: e,
                    }), {});
                }
                const internalServerError = new internal_server_error_1.InternalServerError(e.message);
                if (e instanceof n8n_workflow_1.ExecutionCancelledError)
                    internalServerError.level = 'warning';
                throw internalServerError;
            });
        }
        return executionId;
    }
    catch (e) {
        const error = e instanceof unprocessable_error_1.UnprocessableRequestError
            ? e
            : new n8n_workflow_1.ApplicationError('There was a problem executing the workflow', {
                level: 'warning',
                cause: e,
            });
        if (didSendResponse)
            throw error;
        responseCallback(error, {});
        return;
    }
}
//# sourceMappingURL=webhook-helpers.js.map