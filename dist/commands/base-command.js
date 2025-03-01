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
exports.BaseCommand = void 0;
require("reflect-metadata");
const config_1 = require("@n8n/config");
const core_1 = require("@oclif/core");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const typedi_1 = require("typedi");
const config_2 = __importDefault(require("../config"));
const constants_1 = require("../constants");
const CrashJournal = __importStar(require("../crash-journal"));
const Db = __importStar(require("../db"));
const deduplication_1 = require("../deduplication");
const error_reporting_1 = require("../error-reporting");
const message_event_bus_1 = require("../eventbus/message-event-bus/message-event-bus");
const telemetry_event_relay_1 = require("../events/relays/telemetry.event-relay");
const expression_evaluator_1 = require("../expression-evaluator");
const external_hooks_1 = require("../external-hooks");
const external_secrets_manager_ee_1 = require("../external-secrets/external-secrets-manager.ee");
const license_1 = require("../license");
const load_nodes_and_credentials_1 = require("../load-nodes-and-credentials");
const logger_service_1 = require("../logging/logger.service");
const node_types_1 = require("../node-types");
const posthog_1 = require("../posthog");
const shutdown_service_1 = require("../shutdown/shutdown.service");
const workflow_history_manager_ee_1 = require("../workflows/workflow-history/workflow-history-manager.ee");
class BaseCommand extends core_1.Command {
    constructor() {
        super(...arguments);
        this.logger = typedi_1.Container.get(logger_service_1.Logger);
        this.instanceSettings = typedi_1.Container.get(n8n_core_1.InstanceSettings);
        this.shutdownService = typedi_1.Container.get(shutdown_service_1.ShutdownService);
        this.globalConfig = typedi_1.Container.get(config_1.GlobalConfig);
        this.gracefulShutdownTimeoutInS = typedi_1.Container.get(config_1.GlobalConfig).generic.gracefulShutdownTimeout;
        this.needsCommunityPackages = false;
    }
    async init() {
        await (0, error_reporting_1.initErrorHandling)();
        (0, expression_evaluator_1.initExpressionEvaluator)();
        process.once('SIGTERM', this.onTerminationSignal('SIGTERM'));
        process.once('SIGINT', this.onTerminationSignal('SIGINT'));
        this.nodeTypes = typedi_1.Container.get(node_types_1.NodeTypes);
        await typedi_1.Container.get(load_nodes_and_credentials_1.LoadNodesAndCredentials).init();
        await Db.init().catch(async (error) => await this.exitWithCrash('There was an error initializing DB', error));
        if (constants_1.inDevelopment || constants_1.inTest) {
            this.shutdownService.validate();
        }
        await this.server?.init();
        await Db.migrate().catch(async (error) => await this.exitWithCrash('There was an error running database migrations', error));
        const { type: dbType } = this.globalConfig.database;
        if (['mysqldb', 'mariadb'].includes(dbType)) {
            this.logger.warn('Support for MySQL/MariaDB has been deprecated and will be removed with an upcoming version of n8n. Please migrate to PostgreSQL.');
        }
        if (process.env.N8N_SKIP_WEBHOOK_DEREGISTRATION_SHUTDOWN) {
            this.logger.warn('The flag to skip webhook deregistration N8N_SKIP_WEBHOOK_DEREGISTRATION_SHUTDOWN has been removed. n8n no longer deregisters webhooks at startup and shutdown, in main and queue mode.');
        }
        if (config_2.default.getEnv('executions.mode') === 'queue' && dbType === 'sqlite') {
            this.logger.warn('Queue mode is not officially supported with sqlite. Please switch to PostgreSQL.');
        }
        if (process.env.N8N_BINARY_DATA_TTL ??
            process.env.N8N_PERSISTED_BINARY_DATA_TTL ??
            process.env.EXECUTIONS_DATA_PRUNE_TIMEOUT) {
            this.logger.warn('The env vars N8N_BINARY_DATA_TTL and N8N_PERSISTED_BINARY_DATA_TTL and EXECUTIONS_DATA_PRUNE_TIMEOUT no longer have any effect and can be safely removed. Instead of relying on a TTL system for binary data, n8n currently cleans up binary data together with executions during pruning.');
        }
        const { communityPackages } = this.globalConfig.nodes;
        if (communityPackages.enabled && this.needsCommunityPackages) {
            const { CommunityPackagesService } = await Promise.resolve().then(() => __importStar(require('../services/community-packages.service')));
            await typedi_1.Container.get(CommunityPackagesService).checkForMissingPackages();
        }
        typedi_1.Container.get(message_event_bus_1.MessageEventBus);
        await typedi_1.Container.get(posthog_1.PostHogClient).init();
        await typedi_1.Container.get(telemetry_event_relay_1.TelemetryEventRelay).init();
    }
    async stopProcess() {
    }
    async initCrashJournal() {
        await CrashJournal.init();
    }
    async exitSuccessFully() {
        try {
            await Promise.all([CrashJournal.cleanup(), Db.close()]);
        }
        finally {
            process.exit();
        }
    }
    async exitWithCrash(message, error) {
        n8n_workflow_1.ErrorReporterProxy.error(new Error(message, { cause: error }), { level: 'fatal' });
        await (0, n8n_workflow_1.sleep)(2000);
        process.exit(1);
    }
    async initObjectStoreService() {
        const isSelected = config_2.default.getEnv('binaryDataManager.mode') === 's3';
        const isAvailable = config_2.default.getEnv('binaryDataManager.availableModes').includes('s3');
        if (!isSelected && !isAvailable)
            return;
        if (isSelected && !isAvailable) {
            throw new n8n_workflow_1.ApplicationError('External storage selected but unavailable. Please make external storage available by adding "s3" to `N8N_AVAILABLE_BINARY_DATA_MODES`.');
        }
        const isLicensed = typedi_1.Container.get(license_1.License).isFeatureEnabled(constants_1.LICENSE_FEATURES.BINARY_DATA_S3);
        if (isSelected && isAvailable && isLicensed) {
            this.logger.debug('License found for external storage - object store to init in read-write mode');
            await this._initObjectStoreService();
            return;
        }
        if (isSelected && isAvailable && !isLicensed) {
            this.logger.debug('No license found for external storage - object store to init with writes blocked. To enable writes, please upgrade to a license that supports this feature.');
            await this._initObjectStoreService({ isReadOnly: true });
            return;
        }
        if (!isSelected && isAvailable) {
            this.logger.debug('External storage unselected but available - object store to init with writes unused');
            await this._initObjectStoreService();
            return;
        }
    }
    async _initObjectStoreService(options = { isReadOnly: false }) {
        const objectStoreService = typedi_1.Container.get(n8n_core_1.ObjectStoreService);
        const { host, bucket, credentials } = this.globalConfig.externalStorage.s3;
        if (host === '') {
            throw new n8n_workflow_1.ApplicationError('External storage host not configured. Please set `N8N_EXTERNAL_STORAGE_S3_HOST`.');
        }
        if (bucket.name === '') {
            throw new n8n_workflow_1.ApplicationError('External storage bucket name not configured. Please set `N8N_EXTERNAL_STORAGE_S3_BUCKET_NAME`.');
        }
        if (bucket.region === '') {
            throw new n8n_workflow_1.ApplicationError('External storage bucket region not configured. Please set `N8N_EXTERNAL_STORAGE_S3_BUCKET_REGION`.');
        }
        if (credentials.accessKey === '') {
            throw new n8n_workflow_1.ApplicationError('External storage access key not configured. Please set `N8N_EXTERNAL_STORAGE_S3_ACCESS_KEY`.');
        }
        if (credentials.accessSecret === '') {
            throw new n8n_workflow_1.ApplicationError('External storage access secret not configured. Please set `N8N_EXTERNAL_STORAGE_S3_ACCESS_SECRET`.');
        }
        this.logger.debug('Initializing object store service');
        try {
            await objectStoreService.init(host, bucket, credentials);
            objectStoreService.setReadonly(options.isReadOnly);
            this.logger.debug('Object store init completed');
        }
        catch (e) {
            const error = e instanceof Error ? e : new Error(`${e}`);
            this.logger.debug('Object store init failed', { error });
        }
    }
    async initBinaryDataService() {
        try {
            await this.initObjectStoreService();
        }
        catch (e) {
            const error = e instanceof Error ? e : new Error(`${e}`);
            this.logger.error(`Failed to init object store: ${error.message}`, { error });
            process.exit(1);
        }
        const binaryDataConfig = config_2.default.getEnv('binaryDataManager');
        await typedi_1.Container.get(n8n_core_1.BinaryDataService).init(binaryDataConfig);
    }
    async initDataDeduplicationService() {
        const dataDeduplicationService = (0, deduplication_1.getDataDeduplicationService)();
        await n8n_core_1.DataDeduplicationService.init(dataDeduplicationService);
    }
    async initExternalHooks() {
        this.externalHooks = typedi_1.Container.get(external_hooks_1.ExternalHooks);
        await this.externalHooks.init();
    }
    async initLicense() {
        this.license = typedi_1.Container.get(license_1.License);
        await this.license.init();
        const { activationKey } = this.globalConfig.license;
        if (activationKey) {
            const hasCert = (await this.license.loadCertStr()).length > 0;
            if (hasCert) {
                return this.logger.debug('Skipping license activation');
            }
            try {
                this.logger.debug('Attempting license activation');
                await this.license.activate(activationKey);
                this.logger.debug('License init complete');
            }
            catch (e) {
                const error = (0, n8n_workflow_1.ensureError)(e);
                this.logger.error('Could not activate license', { error });
            }
        }
    }
    async initExternalSecrets() {
        const secretsManager = typedi_1.Container.get(external_secrets_manager_ee_1.ExternalSecretsManager);
        await secretsManager.init();
    }
    initWorkflowHistory() {
        typedi_1.Container.get(workflow_history_manager_ee_1.WorkflowHistoryManager).init();
    }
    async finally(error) {
        if (constants_1.inTest || this.id === 'start')
            return;
        if (Db.connectionState.connected) {
            await (0, n8n_workflow_1.sleep)(100);
            await Db.close();
        }
        const exitCode = error instanceof core_1.Errors.ExitError ? error.oclif.exit : error ? 1 : 0;
        this.exit(exitCode);
    }
    onTerminationSignal(signal) {
        return async () => {
            if (this.shutdownService.isShuttingDown()) {
                this.logger.info(`Received ${signal}. Already shutting down...`);
                return;
            }
            const forceShutdownTimer = setTimeout(async () => {
                this.logger.info(`process exited after ${this.gracefulShutdownTimeoutInS}s`);
                const errorMsg = `Shutdown timed out after ${this.gracefulShutdownTimeoutInS} seconds`;
                await this.exitWithCrash(errorMsg, new Error(errorMsg));
            }, this.gracefulShutdownTimeoutInS * 1000);
            this.logger.info(`Received ${signal}. Shutting down...`);
            this.shutdownService.shutdown();
            await this.shutdownService.waitForShutdown();
            await this.stopProcess();
            clearTimeout(forceShutdownTimer);
        };
    }
}
exports.BaseCommand = BaseCommand;
//# sourceMappingURL=base-command.js.map