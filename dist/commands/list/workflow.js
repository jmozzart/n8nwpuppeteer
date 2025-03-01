"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListWorkflowCommand = void 0;
const core_1 = require("@oclif/core");
const typedi_1 = __importDefault(require("typedi"));
const workflow_repository_1 = require("../../databases/repositories/workflow.repository");
const base_command_1 = require("../base-command");
class ListWorkflowCommand extends base_command_1.BaseCommand {
    async run() {
        const { flags } = await this.parse(ListWorkflowCommand);
        if (flags.active !== undefined && !['true', 'false'].includes(flags.active)) {
            this.error('The --active flag has to be passed using true or false');
        }
        const workflowRepository = typedi_1.default.get(workflow_repository_1.WorkflowRepository);
        const workflows = flags.active !== undefined
            ? await workflowRepository.findByActiveState(flags.active === 'true')
            : await workflowRepository.find();
        if (flags.onlyId) {
            workflows.forEach((workflow) => this.logger.info(workflow.id));
        }
        else {
            workflows.forEach((workflow) => this.logger.info(`${workflow.id}|${workflow.name}`));
        }
    }
    async catch(error) {
        this.logger.error('\nGOT ERROR');
        this.logger.error('====================================');
        this.logger.error(error.message);
        this.logger.error(error.stack);
    }
}
exports.ListWorkflowCommand = ListWorkflowCommand;
ListWorkflowCommand.description = '\nList workflows';
ListWorkflowCommand.examples = [
    '$ n8n list:workflow',
    '$ n8n list:workflow --active=true --onlyId',
    '$ n8n list:workflow --active=false',
];
ListWorkflowCommand.flags = {
    help: core_1.Flags.help({ char: 'h' }),
    active: core_1.Flags.string({
        description: 'Filters workflows by active status. Can be true or false',
    }),
    onlyId: core_1.Flags.boolean({
        description: 'Outputs workflow IDs only, one per line.',
    }),
};
//# sourceMappingURL=workflow.js.map