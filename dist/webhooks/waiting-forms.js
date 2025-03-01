"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WaitingForms = void 0;
const axios_1 = __importDefault(require("axios"));
const n8n_workflow_1 = require("n8n-workflow");
const typedi_1 = require("typedi");
const conflict_error_1 = require("../errors/response-errors/conflict.error");
const not_found_error_1 = require("../errors/response-errors/not-found.error");
const waiting_webhooks_1 = require("../webhooks/waiting-webhooks");
let WaitingForms = class WaitingForms extends waiting_webhooks_1.WaitingWebhooks {
    constructor() {
        super(...arguments);
        this.includeForms = true;
    }
    logReceivedWebhook(method, executionId) {
        this.logger.debug(`Received waiting-form "${method}" for execution "${executionId}"`);
    }
    disableNode(execution, method) {
        if (method === 'POST') {
            execution.data.executionData.nodeExecutionStack[0].node.disabled = true;
        }
    }
    getWorkflow(execution) {
        const { workflowData } = execution;
        return new n8n_workflow_1.Workflow({
            id: workflowData.id,
            name: workflowData.name,
            nodes: workflowData.nodes,
            connections: workflowData.connections,
            active: workflowData.active,
            nodeTypes: this.nodeTypes,
            staticData: workflowData.staticData,
            settings: workflowData.settings,
        });
    }
    async reloadForm(req, res) {
        try {
            await (0, n8n_workflow_1.sleep)(1000);
            const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
            const page = await (0, axios_1.default)({ url });
            if (page) {
                res.send(`
				<script>
					setTimeout(function() {
						window.location.reload();
					}, 1);
				</script>
			`);
            }
        }
        catch (error) { }
    }
    findCompletionPage(workflow, runData, lastNodeExecuted) {
        const parentNodes = workflow.getParentNodes(lastNodeExecuted);
        const lastNode = workflow.nodes[lastNodeExecuted];
        if (!lastNode.disabled &&
            lastNode.type === n8n_workflow_1.FORM_NODE_TYPE &&
            lastNode.parameters.operation === 'completion') {
            return lastNodeExecuted;
        }
        else {
            return parentNodes.reverse().find((nodeName) => {
                const node = workflow.nodes[nodeName];
                return (!node.disabled &&
                    node.type === n8n_workflow_1.FORM_NODE_TYPE &&
                    node.parameters.operation === 'completion' &&
                    runData[nodeName]);
            });
        }
    }
    async executeWebhook(req, res) {
        const { path: executionId, suffix } = req.params;
        this.logReceivedWebhook(req.method, executionId);
        req.params = {};
        const execution = await this.getExecution(executionId);
        if (!execution) {
            throw new not_found_error_1.NotFoundError(`The execution "${executionId}" does not exist.`);
        }
        if (execution.data.resultData.error) {
            const message = `The execution "${executionId}" has finished with error.`;
            this.logger.debug(message, { error: execution.data.resultData.error });
            throw new conflict_error_1.ConflictError(message);
        }
        if (execution.status === 'running') {
            if (this.includeForms && req.method === 'GET') {
                await this.reloadForm(req, res);
                return { noWebhookResponse: true };
            }
            throw new conflict_error_1.ConflictError(`The execution "${executionId}" is running already.`);
        }
        let lastNodeExecuted = execution.data.resultData.lastNodeExecuted;
        if (execution.finished) {
            const workflow = this.getWorkflow(execution);
            const completionPage = this.findCompletionPage(workflow, execution.data.resultData.runData, lastNodeExecuted);
            if (!completionPage) {
                res.render('form-trigger-completion', {
                    title: 'Form Submitted',
                    message: 'Your response has been recorded',
                    formTitle: 'Form Submitted',
                });
                return {
                    noWebhookResponse: true,
                };
            }
            else {
                lastNodeExecuted = completionPage;
            }
        }
        return await this.getWebhookExecutionData({
            execution,
            req,
            res,
            lastNodeExecuted,
            executionId,
            suffix,
        });
    }
};
exports.WaitingForms = WaitingForms;
exports.WaitingForms = WaitingForms = __decorate([
    (0, typedi_1.Service)()
], WaitingForms);
//# sourceMappingURL=waiting-forms.js.map