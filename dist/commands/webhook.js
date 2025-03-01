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
exports.Webhook = void 0;
const core_1 = require("@oclif/core");
const n8n_workflow_1 = require("n8n-workflow");
const typedi_1 = require("typedi");
const active_executions_1 = require("../active-executions");
const config_1 = __importDefault(require("../config"));
const pubsub_handler_1 = require("../scaling/pubsub/pubsub-handler");
const subscriber_service_1 = require("../scaling/pubsub/subscriber.service");
const orchestration_service_1 = require("../services/orchestration.service");
const webhook_server_1 = require("../webhooks/webhook-server");
const base_command_1 = require("./base-command");
class Webhook extends base_command_1.BaseCommand {
    constructor() {
        super(...arguments);
        this.server = typedi_1.Container.get(webhook_server_1.WebhookServer);
        this.needsCommunityPackages = true;
    }
    async stopProcess() {
        this.logger.info('\nStopping n8n...');
        try {
            await this.externalHooks?.run('n8n.stop', []);
            await typedi_1.Container.get(active_executions_1.ActiveExecutions).shutdown();
        }
        catch (error) {
            await this.exitWithCrash('There was an error shutting down n8n.', error);
        }
        await this.exitSuccessFully();
    }
    async init() {
        if (config_1.default.getEnv('executions.mode') !== 'queue') {
            this.error('Webhook processes can only run with execution mode as queue.');
        }
        await this.initCrashJournal();
        this.logger.debug('Crash journal initialized');
        this.logger.info('Starting n8n webhook process...');
        this.logger.debug(`Host ID: ${this.instanceSettings.hostId}`);
        await super.init();
        await this.initLicense();
        this.logger.debug('License init complete');
        await this.initOrchestration();
        this.logger.debug('Orchestration init complete');
        await this.initBinaryDataService();
        this.logger.debug('Binary data service init complete');
        await this.initDataDeduplicationService();
        this.logger.debug('Data deduplication service init complete');
        await this.initExternalHooks();
        this.logger.debug('External hooks init complete');
        await this.initExternalSecrets();
        this.logger.debug('External secrets init complete');
    }
    async run() {
        if (this.globalConfig.multiMainSetup.enabled) {
            throw new n8n_workflow_1.ApplicationError('Webhook process cannot be started when multi-main setup is enabled.');
        }
        const { ScalingService } = await Promise.resolve().then(() => __importStar(require('../scaling/scaling.service')));
        await typedi_1.Container.get(ScalingService).setupQueue();
        await this.server.start();
        this.logger.info('Webhook listener waiting for requests.');
        await new Promise(() => { });
    }
    async catch(error) {
        await this.exitWithCrash('Exiting due to an error.', error);
    }
    async initOrchestration() {
        await typedi_1.Container.get(orchestration_service_1.OrchestrationService).init();
        typedi_1.Container.get(pubsub_handler_1.PubSubHandler).init();
        await typedi_1.Container.get(subscriber_service_1.Subscriber).subscribe('n8n.commands');
    }
}
exports.Webhook = Webhook;
Webhook.description = 'Starts n8n webhook process. Intercepts only production URLs.';
Webhook.examples = ['$ n8n webhook'];
Webhook.flags = {
    help: core_1.Flags.help({ char: 'h' }),
};
//# sourceMappingURL=webhook.js.map