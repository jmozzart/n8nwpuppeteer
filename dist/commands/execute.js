"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Execute = void 0;
const core_1 = require("@oclif/core");
const n8n_workflow_1 = require("n8n-workflow");
const typedi_1 = require("typedi");
const active_executions_1 = require("../active-executions");
const workflow_repository_1 = require("../databases/repositories/workflow.repository");
const ownership_service_1 = require("../services/ownership.service");
const utils_1 = require("../utils");
const workflow_runner_1 = require("../workflow-runner");
const base_command_1 = require("./base-command");
class Execute extends base_command_1.BaseCommand {
    constructor() {
        super(...arguments);
        this.needsCommunityPackages = true;
    }
    async init() {
        await super.init();
        await this.initBinaryDataService();
        await this.initDataDeduplicationService();
        await this.initExternalHooks();
    }
    async run() {
        const { flags } = await this.parse(Execute);
        if (!flags.id) {
            this.logger.info('"--id" has to be set!');
            return;
        }
        if (flags.file) {
            throw new n8n_workflow_1.ApplicationError('The --file flag is no longer supported. Please first import the workflow and then execute it using the --id flag.', { level: 'warning' });
        }
        let workflowId;
        let workflowData = null;
        if (flags.id) {
            workflowId = flags.id;
            workflowData = await typedi_1.Container.get(workflow_repository_1.WorkflowRepository).findOneBy({ id: workflowId });
            if (workflowData === null) {
                this.logger.info(`The workflow with the id "${workflowId}" does not exist.`);
                process.exit(1);
            }
        }
        if (!workflowData) {
            throw new n8n_workflow_1.ApplicationError('Failed to retrieve workflow data for requested workflow');
        }
        if (!(0, utils_1.isWorkflowIdValid)(workflowId)) {
            workflowId = undefined;
        }
        const startingNode = (0, utils_1.findCliWorkflowStart)(workflowData.nodes);
        const user = await typedi_1.Container.get(ownership_service_1.OwnershipService).getInstanceOwner();
        const runData = {
            executionMode: 'cli',
            startNodes: [{ name: startingNode.name, sourceData: null }],
            workflowData,
            userId: user.id,
        };
        const executionId = await typedi_1.Container.get(workflow_runner_1.WorkflowRunner).run(runData);
        const activeExecutions = typedi_1.Container.get(active_executions_1.ActiveExecutions);
        const data = await activeExecutions.getPostExecutePromise(executionId);
        if (data === undefined) {
            throw new n8n_workflow_1.ApplicationError('Workflow did not return any data');
        }
        if (data.data.resultData.error) {
            this.logger.info('Execution was NOT successful. See log message for details.');
            this.logger.info('Execution error:');
            this.logger.info('====================================');
            this.logger.info(JSON.stringify(data, null, 2));
            const { error } = data.data.resultData;
            throw {
                ...error,
                stack: error.stack,
            };
        }
        if (flags.rawOutput === undefined) {
            this.log('Execution was successful:');
            this.log('====================================');
        }
        this.log(JSON.stringify(data, null, 2));
    }
    async catch(error) {
        this.logger.error('Error executing workflow. See log messages for details.');
        this.logger.error('\nExecution error:');
        this.logger.info('====================================');
        this.logger.error(error.message);
        if (error instanceof n8n_workflow_1.ExecutionBaseError)
            this.logger.error(error.description);
        this.logger.error(error.stack);
    }
}
exports.Execute = Execute;
Execute.description = '\nExecutes a given workflow';
Execute.examples = ['$ n8n execute --id=5'];
Execute.flags = {
    help: core_1.Flags.help({ char: 'h' }),
    id: core_1.Flags.string({
        description: 'id of the workflow to execute',
    }),
    rawOutput: core_1.Flags.boolean({
        description: 'Outputs only JSON data, with no other text',
    }),
};
//# sourceMappingURL=execute.js.map