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
exports.Start = void 0;
const config_1 = require("@n8n/config");
const core_1 = require("@oclif/core");
const fast_glob_1 = __importDefault(require("fast-glob"));
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const n8n_workflow_1 = require("n8n-workflow");
const path_1 = __importDefault(require("path"));
const replacestream_1 = __importDefault(require("replacestream"));
const promises_2 = require("stream/promises");
const typedi_1 = require("typedi");
const active_executions_1 = require("../active-executions");
const active_workflow_manager_1 = require("../active-workflow-manager");
const config_2 = __importDefault(require("../config"));
const constants_1 = require("../constants");
const execution_repository_1 = require("../databases/repositories/execution.repository");
const settings_repository_1 = require("../databases/repositories/settings.repository");
const feature_not_licensed_error_1 = require("../errors/feature-not-licensed.error");
const message_event_bus_1 = require("../eventbus/message-event-bus/message-event-bus");
const event_service_1 = require("../events/event.service");
const execution_service_1 = require("../executions/execution.service");
const license_1 = require("../license");
const pubsub_handler_1 = require("../scaling/pubsub/pubsub-handler");
const subscriber_service_1 = require("../scaling/pubsub/subscriber.service");
const server_1 = require("../server");
const orchestration_service_1 = require("../services/orchestration.service");
const ownership_service_1 = require("../services/ownership.service");
const pruning_service_1 = require("../services/pruning/pruning.service");
const url_service_1 = require("../services/url.service");
const wait_tracker_1 = require("../wait-tracker");
const workflow_runner_1 = require("../workflow-runner");
const base_command_1 = require("./base-command");
const open = require('open');
class Start extends base_command_1.BaseCommand {
    constructor() {
        super(...arguments);
        this.server = typedi_1.Container.get(server_1.Server);
        this.needsCommunityPackages = true;
    }
    openBrowser() {
        const editorUrl = typedi_1.Container.get(url_service_1.UrlService).baseUrl;
        open(editorUrl, { wait: true }).catch(() => {
            this.logger.info(`\nWas not able to open URL in browser. Please open manually by visiting:\n${editorUrl}\n`);
        });
    }
    async stopProcess() {
        this.logger.info('\nStopping n8n...');
        try {
            this.activeWorkflowManager.removeAllQueuedWorkflowActivations();
            typedi_1.Container.get(wait_tracker_1.WaitTracker).stopTracking();
            await this.externalHooks?.run('n8n.stop', []);
            await this.activeWorkflowManager.removeAllTriggerAndPollerBasedWorkflows();
            if (typedi_1.Container.get(orchestration_service_1.OrchestrationService).isMultiMainSetupEnabled) {
                await typedi_1.Container.get(orchestration_service_1.OrchestrationService).shutdown();
            }
            typedi_1.Container.get(event_service_1.EventService).emit('instance-stopped');
            await typedi_1.Container.get(active_executions_1.ActiveExecutions).shutdown();
            await typedi_1.Container.get(message_event_bus_1.MessageEventBus).close();
        }
        catch (error) {
            await this.exitWithCrash('There was an error shutting down n8n.', error);
        }
        await this.exitSuccessFully();
    }
    async generateStaticAssets() {
        const n8nPath = this.globalConfig.path;
        const hooksUrls = config_2.default.getEnv('externalFrontendHooksUrls');
        let scriptsString = '';
        if (hooksUrls) {
            scriptsString = hooksUrls.split(';').reduce((acc, curr) => {
                return `${acc}<script src="${curr}"></script>`;
            }, '');
        }
        const closingTitleTag = '</title>';
        const { staticCacheDir } = this.instanceSettings;
        const compileFile = async (fileName) => {
            const filePath = path_1.default.join(constants_1.EDITOR_UI_DIST_DIR, fileName);
            if (/(index\.html)|.*\.(js|css)/.test(filePath) && (0, fs_1.existsSync)(filePath)) {
                const destFile = path_1.default.join(staticCacheDir, fileName);
                await (0, promises_1.mkdir)(path_1.default.dirname(destFile), { recursive: true });
                const streams = [
                    (0, fs_1.createReadStream)(filePath, 'utf-8'),
                    (0, replacestream_1.default)('/{{BASE_PATH}}/', n8nPath, { ignoreCase: false }),
                    (0, replacestream_1.default)('/%7B%7BBASE_PATH%7D%7D/', n8nPath, { ignoreCase: false }),
                    (0, replacestream_1.default)('/%257B%257BBASE_PATH%257D%257D/', n8nPath, { ignoreCase: false }),
                    (0, replacestream_1.default)('/static/', n8nPath + 'static/', { ignoreCase: false }),
                ];
                if (filePath.endsWith('index.html')) {
                    streams.push((0, replacestream_1.default)('{{REST_ENDPOINT}}', this.globalConfig.endpoints.rest, {
                        ignoreCase: false,
                    }), (0, replacestream_1.default)(closingTitleTag, closingTitleTag + scriptsString, {
                        ignoreCase: false,
                    }));
                }
                streams.push((0, fs_1.createWriteStream)(destFile, 'utf-8'));
                return await (0, promises_2.pipeline)(streams);
            }
        };
        await compileFile('index.html');
        const files = await (0, fast_glob_1.default)('**/*.{css,js}', { cwd: constants_1.EDITOR_UI_DIST_DIR });
        await Promise.all(files.map(compileFile));
    }
    async init() {
        await this.initCrashJournal();
        this.logger.info('Initializing n8n process');
        if (config_2.default.getEnv('executions.mode') === 'queue') {
            const scopedLogger = this.logger.scoped('scaling');
            scopedLogger.debug('Starting main instance in scaling mode');
            scopedLogger.debug(`Host ID: ${this.instanceSettings.hostId}`);
        }
        const { flags } = await this.parse(Start);
        const { communityPackages } = this.globalConfig.nodes;
        if (flags.reinstallMissingPackages) {
            if (communityPackages.enabled) {
                this.logger.warn('`--reinstallMissingPackages` is deprecated: Please use the env variable `N8N_REINSTALL_MISSING_PACKAGES` instead');
                communityPackages.reinstallMissing = true;
            }
            else {
                this.logger.warn('`--reinstallMissingPackages` was passed, but community packages are disabled');
            }
        }
        await super.init();
        this.activeWorkflowManager = typedi_1.Container.get(active_workflow_manager_1.ActiveWorkflowManager);
        await this.initLicense();
        await this.initOrchestration();
        this.logger.debug('Orchestration init complete');
        if (!this.globalConfig.license.autoRenewalEnabled && this.instanceSettings.isLeader) {
            this.logger.warn('Automatic license renewal is disabled. The license will not renew automatically, and access to licensed features may be lost!');
        }
        typedi_1.Container.get(wait_tracker_1.WaitTracker).init();
        this.logger.debug('Wait tracker init complete');
        await this.initBinaryDataService();
        this.logger.debug('Binary data service init complete');
        await this.initDataDeduplicationService();
        this.logger.debug('Data deduplication service init complete');
        await this.initExternalHooks();
        this.logger.debug('External hooks init complete');
        await this.initExternalSecrets();
        this.logger.debug('External secrets init complete');
        this.initWorkflowHistory();
        this.logger.debug('Workflow history init complete');
        if (!this.globalConfig.endpoints.disableUi) {
            await this.generateStaticAssets();
        }
        const { taskRunners: taskRunnerConfig } = this.globalConfig;
        if (taskRunnerConfig.enabled) {
            const { TaskRunnerModule } = await Promise.resolve().then(() => __importStar(require('../runners/task-runner-module')));
            const taskRunnerModule = typedi_1.Container.get(TaskRunnerModule);
            await taskRunnerModule.start();
        }
    }
    async initOrchestration() {
        if (config_2.default.getEnv('executions.mode') === 'regular') {
            this.instanceSettings.markAsLeader();
            return;
        }
        if (typedi_1.Container.get(config_1.GlobalConfig).multiMainSetup.enabled &&
            !typedi_1.Container.get(license_1.License).isMultipleMainInstancesLicensed()) {
            throw new feature_not_licensed_error_1.FeatureNotLicensedError(constants_1.LICENSE_FEATURES.MULTIPLE_MAIN_INSTANCES);
        }
        const orchestrationService = typedi_1.Container.get(orchestration_service_1.OrchestrationService);
        await orchestrationService.init();
        typedi_1.Container.get(pubsub_handler_1.PubSubHandler).init();
        const subscriber = typedi_1.Container.get(subscriber_service_1.Subscriber);
        await subscriber.subscribe('n8n.commands');
        await subscriber.subscribe('n8n.worker-response');
        this.logger.scoped(['scaling', 'pubsub']).debug('Pubsub setup completed');
        if (!orchestrationService.isMultiMainSetupEnabled)
            return;
        orchestrationService.multiMainSetup
            .on('leader-stepdown', async () => {
            await this.license.reinit();
            await this.activeWorkflowManager.removeAllTriggerAndPollerBasedWorkflows();
        })
            .on('leader-takeover', async () => {
            await this.license.reinit();
            await this.activeWorkflowManager.addAllTriggerAndPollerBasedWorkflows();
        });
    }
    async run() {
        const { flags } = await this.parse(Start);
        const databaseSettings = await typedi_1.Container.get(settings_repository_1.SettingsRepository).findBy({
            loadOnStartup: true,
        });
        databaseSettings.forEach((setting) => {
            config_2.default.set(setting.key, (0, n8n_workflow_1.jsonParse)(setting.value, { fallbackValue: setting.value }));
        });
        const { type: dbType } = this.globalConfig.database;
        if (dbType === 'sqlite') {
            const shouldRunVacuum = this.globalConfig.database.sqlite.executeVacuumOnStartup;
            if (shouldRunVacuum) {
                await typedi_1.Container.get(execution_repository_1.ExecutionRepository).query('VACUUM;');
            }
        }
        if (flags.tunnel) {
            this.log('\nWaiting for tunnel ...');
            let tunnelSubdomain = process.env.N8N_TUNNEL_SUBDOMAIN ?? this.instanceSettings.tunnelSubdomain ?? '';
            if (tunnelSubdomain === '') {
                tunnelSubdomain = (0, n8n_workflow_1.randomString)(24).toLowerCase();
                this.instanceSettings.update({ tunnelSubdomain });
            }
            const { default: localtunnel } = await Promise.resolve().then(() => __importStar(require('@n8n/localtunnel')));
            const { port } = this.globalConfig;
            const webhookTunnel = await localtunnel(port, {
                host: 'https://hooks.n8n.cloud',
                subdomain: tunnelSubdomain,
            });
            process.env.WEBHOOK_URL = `${webhookTunnel.url}/`;
            this.log(`Tunnel URL: ${process.env.WEBHOOK_URL}\n`);
            this.log('IMPORTANT! Do not share with anybody as it would give people access to your n8n instance!');
        }
        await this.server.start();
        typedi_1.Container.get(pruning_service_1.PruningService).init();
        if (config_2.default.getEnv('executions.mode') === 'regular') {
            await this.runEnqueuedExecutions();
        }
        await this.activeWorkflowManager.init();
        const editorUrl = typedi_1.Container.get(url_service_1.UrlService).baseUrl;
        this.log(`\nEditor is now accessible via:\n${editorUrl}`);
        if (Boolean(process.stdout.isTTY) && process.stdin.setRawMode) {
            process.stdin.setRawMode(true);
            process.stdin.resume();
            process.stdin.setEncoding('utf8');
            if (flags.open) {
                this.openBrowser();
            }
            this.log('\nPress "o" to open in Browser.');
            process.stdin.on('data', (key) => {
                if (key === 'o') {
                    this.openBrowser();
                }
                else if (key.charCodeAt(0) === 3) {
                    void this.onTerminationSignal('SIGINT')();
                }
                else {
                    if (key.charCodeAt(0) === 13) {
                        process.stdout.write('\n');
                    }
                    else {
                        process.stdout.write(key);
                    }
                }
            });
        }
    }
    async catch(error) {
        if (error.stack)
            this.logger.error(error.stack);
        await this.exitWithCrash('Exiting due to an error.', error);
    }
    async runEnqueuedExecutions() {
        const executions = await typedi_1.Container.get(execution_service_1.ExecutionService).findAllEnqueuedExecutions();
        if (executions.length === 0)
            return;
        this.logger.debug('[Startup] Found enqueued executions to run', {
            executionIds: executions.map((e) => e.id),
        });
        const ownershipService = typedi_1.Container.get(ownership_service_1.OwnershipService);
        const workflowRunner = typedi_1.Container.get(workflow_runner_1.WorkflowRunner);
        for (const execution of executions) {
            const project = await ownershipService.getWorkflowProjectCached(execution.workflowId);
            const data = {
                executionMode: execution.mode,
                executionData: execution.data,
                workflowData: execution.workflowData,
                projectId: project.id,
            };
            typedi_1.Container.get(event_service_1.EventService).emit('execution-started-during-bootup', {
                executionId: execution.id,
            });
            void workflowRunner.run(data, undefined, false, execution.id);
        }
    }
}
exports.Start = Start;
Start.description = 'Starts n8n. Makes Web-UI available and starts active workflows';
Start.examples = [
    '$ n8n start',
    '$ n8n start --tunnel',
    '$ n8n start -o',
    '$ n8n start --tunnel -o',
];
Start.flags = {
    help: core_1.Flags.help({ char: 'h' }),
    open: core_1.Flags.boolean({
        char: 'o',
        description: 'opens the UI automatically in browser',
    }),
    tunnel: core_1.Flags.boolean({
        description: 'runs the webhooks via a hooks.n8n.cloud tunnel server. Use only for testing and development!',
    }),
    reinstallMissingPackages: core_1.Flags.boolean({
        description: 'Attempts to self heal n8n if packages with nodes are missing. Might drastically increase startup times.',
    }),
};
//# sourceMappingURL=start.js.map