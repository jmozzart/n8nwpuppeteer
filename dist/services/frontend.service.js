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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FrontendService = void 0;
const config_1 = require("@n8n/config");
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const uniq_1 = __importDefault(require("lodash/uniq"));
const n8n_core_1 = require("n8n-core");
const node_fs_1 = __importDefault(require("node:fs"));
const path_1 = __importDefault(require("path"));
const typedi_1 = require("typedi");
const config_2 = __importDefault(require("../config"));
const constants_1 = require("../constants");
const credential_types_1 = require("../credential-types");
const credentials_overwrites_1 = require("../credentials-overwrites");
const environment_helpers_1 = require("../environments/variables/environment-helpers");
const helpers_ee_1 = require("../ldap/helpers.ee");
const license_1 = require("../license");
const load_nodes_and_credentials_1 = require("../load-nodes-and-credentials");
const logger_service_1 = require("../logging/logger.service");
const public_api_1 = require("../public-api");
const saml_helpers_1 = require("../sso/saml/saml-helpers");
const sso_helpers_1 = require("../sso/sso-helpers");
const email_1 = require("../user-management/email");
const workflow_history_helper_ee_1 = require("../workflows/workflow-history/workflow-history-helper.ee");
const url_service_1 = require("./url.service");
let FrontendService = class FrontendService {
    constructor(globalConfig, logger, loadNodesAndCredentials, credentialTypes, credentialsOverwrites, license, mailer, instanceSettings, urlService, securityConfig, frontendConfig) {
        this.globalConfig = globalConfig;
        this.logger = logger;
        this.loadNodesAndCredentials = loadNodesAndCredentials;
        this.credentialTypes = credentialTypes;
        this.credentialsOverwrites = credentialsOverwrites;
        this.license = license;
        this.mailer = mailer;
        this.instanceSettings = instanceSettings;
        this.urlService = urlService;
        this.securityConfig = securityConfig;
        this.frontendConfig = frontendConfig;
        loadNodesAndCredentials.addPostProcessor(async () => await this.generateTypes());
        void this.generateTypes();
        this.initSettings();
        if (this.globalConfig.nodes.communityPackages.enabled) {
            void Promise.resolve().then(() => __importStar(require('../services/community-packages.service'))).then(({ CommunityPackagesService }) => {
                this.communityPackagesService = typedi_1.Container.get(CommunityPackagesService);
            });
        }
    }
    initSettings() {
        const instanceBaseUrl = this.urlService.getInstanceBaseUrl();
        const restEndpoint = this.globalConfig.endpoints.rest;
        const telemetrySettings = {
            enabled: this.globalConfig.diagnostics.enabled,
        };
        if (telemetrySettings.enabled) {
            const conf = this.globalConfig.diagnostics.frontendConfig;
            const [key, url] = conf.split(';');
            if (!key || !url) {
                this.logger.warn('Diagnostics frontend config is invalid');
                telemetrySettings.enabled = false;
            }
            telemetrySettings.config = { key, url };
        }
        this.settings = {
            inE2ETests: constants_1.inE2ETests,
            isDocker: this.isDocker(),
            databaseType: this.globalConfig.database.type,
            previewMode: process.env.N8N_PREVIEW_MODE === 'true',
            endpointForm: this.globalConfig.endpoints.form,
            endpointFormTest: this.globalConfig.endpoints.formTest,
            endpointFormWaiting: this.globalConfig.endpoints.formWaiting,
            endpointWebhook: this.globalConfig.endpoints.webhook,
            endpointWebhookTest: this.globalConfig.endpoints.webhookTest,
            endpointWebhookWaiting: this.globalConfig.endpoints.webhookWaiting,
            saveDataErrorExecution: config_2.default.getEnv('executions.saveDataOnError'),
            saveDataSuccessExecution: config_2.default.getEnv('executions.saveDataOnSuccess'),
            saveManualExecutions: config_2.default.getEnv('executions.saveDataManualExecutions'),
            saveExecutionProgress: config_2.default.getEnv('executions.saveExecutionProgress'),
            executionTimeout: config_2.default.getEnv('executions.timeout'),
            maxExecutionTimeout: config_2.default.getEnv('executions.maxTimeout'),
            workflowCallerPolicyDefaultOption: this.globalConfig.workflows.callerPolicyDefaultOption,
            timezone: this.globalConfig.generic.timezone,
            urlBaseWebhook: this.urlService.getWebhookBaseUrl(),
            urlBaseEditor: instanceBaseUrl,
            binaryDataMode: config_2.default.getEnv('binaryDataManager.mode'),
            nodeJsVersion: process.version.replace(/^v/, ''),
            versionCli: constants_1.N8N_VERSION,
            concurrency: config_2.default.getEnv('executions.concurrency.productionLimit'),
            authCookie: {
                secure: config_2.default.getEnv('secure_cookie'),
            },
            releaseChannel: this.globalConfig.generic.releaseChannel,
            oauthCallbackUrls: {
                oauth1: `${instanceBaseUrl}/${restEndpoint}/oauth1-credential/callback`,
                oauth2: `${instanceBaseUrl}/${restEndpoint}/oauth2-credential/callback`,
            },
            versionNotifications: {
                enabled: this.globalConfig.versionNotifications.enabled,
                endpoint: this.globalConfig.versionNotifications.endpoint,
                infoUrl: this.globalConfig.versionNotifications.infoUrl,
            },
            instanceId: this.instanceSettings.instanceId,
            telemetry: telemetrySettings,
            posthog: {
                enabled: this.globalConfig.diagnostics.enabled,
                apiHost: this.globalConfig.diagnostics.posthogConfig.apiHost,
                apiKey: this.globalConfig.diagnostics.posthogConfig.apiKey,
                autocapture: false,
                disableSessionRecording: config_2.default.getEnv('deployment.type') !== 'cloud',
                debug: this.globalConfig.logging.level === 'debug',
            },
            personalizationSurveyEnabled: config_2.default.getEnv('personalization.enabled') && this.globalConfig.diagnostics.enabled,
            defaultLocale: config_2.default.getEnv('defaultLocale'),
            userManagement: {
                quota: this.license.getUsersLimit(),
                showSetupOnFirstLoad: !config_2.default.getEnv('userManagement.isInstanceOwnerSetUp'),
                smtpSetup: this.mailer.isEmailSetUp,
                authenticationMethod: (0, sso_helpers_1.getCurrentAuthenticationMethod)(),
            },
            sso: {
                saml: {
                    loginEnabled: false,
                    loginLabel: '',
                },
                ldap: {
                    loginEnabled: false,
                    loginLabel: '',
                },
            },
            publicApi: {
                enabled: (0, public_api_1.isApiEnabled)(),
                latestVersion: 1,
                path: this.globalConfig.publicApi.path,
                swaggerUi: {
                    enabled: !this.globalConfig.publicApi.swaggerUiDisabled,
                },
            },
            workflowTagsDisabled: config_2.default.getEnv('workflowTagsDisabled'),
            logLevel: this.globalConfig.logging.level,
            hiringBannerEnabled: config_2.default.getEnv('hiringBanner.enabled'),
            aiAssistant: {
                enabled: false,
            },
            templates: {
                enabled: this.globalConfig.templates.enabled,
                host: this.globalConfig.templates.host,
            },
            executionMode: config_2.default.getEnv('executions.mode'),
            pushBackend: config_2.default.getEnv('push.backend'),
            communityNodesEnabled: this.globalConfig.nodes.communityPackages.enabled,
            deployment: {
                type: config_2.default.getEnv('deployment.type'),
            },
            allowedModules: {
                builtIn: process.env.NODE_FUNCTION_ALLOW_BUILTIN?.split(',') ?? undefined,
                external: process.env.NODE_FUNCTION_ALLOW_EXTERNAL?.split(',') ?? undefined,
            },
            enterprise: {
                sharing: false,
                ldap: false,
                saml: false,
                logStreaming: false,
                advancedExecutionFilters: false,
                variables: false,
                sourceControl: false,
                auditLogs: false,
                externalSecrets: false,
                showNonProdBanner: false,
                debugInEditor: false,
                binaryDataS3: false,
                workflowHistory: false,
                workerView: false,
                advancedPermissions: false,
                projects: {
                    team: {
                        limit: 0,
                    },
                },
            },
            mfa: {
                enabled: false,
            },
            hideUsagePage: config_2.default.getEnv('hideUsagePage'),
            license: {
                consumerId: 'unknown',
                environment: this.globalConfig.license.tenantId === 1 ? 'production' : 'staging',
            },
            variables: {
                limit: 0,
            },
            expressions: {
                evaluator: config_2.default.getEnv('expression.evaluator'),
            },
            banners: {
                dismissed: [],
            },
            askAi: {
                enabled: false,
            },
            workflowHistory: {
                pruneTime: -1,
                licensePruneTime: -1,
            },
            pruning: {
                isEnabled: this.globalConfig.executions.pruneData,
                maxAge: this.globalConfig.executions.pruneDataMaxAge,
                maxCount: this.globalConfig.executions.pruneDataMaxCount,
            },
            security: {
                blockFileAccessToN8nFiles: this.securityConfig.blockFileAccessToN8nFiles,
            },
            betaFeatures: this.frontendConfig.betaFeatures,
        };
    }
    async generateTypes() {
        this.overwriteCredentialsProperties();
        const { staticCacheDir } = this.instanceSettings;
        await (0, promises_1.mkdir)(path_1.default.join(staticCacheDir, 'types'), { recursive: true });
        const { credentials, nodes } = this.loadNodesAndCredentials.types;
        this.writeStaticJSON('nodes', nodes);
        this.writeStaticJSON('credentials', credentials);
    }
    getSettings() {
        const restEndpoint = this.globalConfig.endpoints.rest;
        const instanceBaseUrl = this.urlService.getInstanceBaseUrl();
        this.settings.urlBaseWebhook = this.urlService.getWebhookBaseUrl();
        this.settings.urlBaseEditor = instanceBaseUrl;
        this.settings.oauthCallbackUrls = {
            oauth1: `${instanceBaseUrl}/${restEndpoint}/oauth1-credential/callback`,
            oauth2: `${instanceBaseUrl}/${restEndpoint}/oauth2-credential/callback`,
        };
        Object.assign(this.settings.userManagement, {
            quota: this.license.getUsersLimit(),
            authenticationMethod: (0, sso_helpers_1.getCurrentAuthenticationMethod)(),
            showSetupOnFirstLoad: !config_2.default.getEnv('userManagement.isInstanceOwnerSetUp'),
        });
        let dismissedBanners = [];
        try {
            dismissedBanners = config_2.default.getEnv('ui.banners.dismissed') ?? [];
        }
        catch {
        }
        this.settings.banners.dismissed = dismissedBanners;
        const isS3Selected = config_2.default.getEnv('binaryDataManager.mode') === 's3';
        const isS3Available = config_2.default.getEnv('binaryDataManager.availableModes').includes('s3');
        const isS3Licensed = this.license.isBinaryDataS3Licensed();
        const isAiAssistantEnabled = this.license.isAiAssistantEnabled();
        const isAskAiEnabled = this.license.isAskAiEnabled();
        this.settings.license.planName = this.license.getPlanName();
        this.settings.license.consumerId = this.license.getConsumerId();
        Object.assign(this.settings.enterprise, {
            sharing: this.license.isSharingEnabled(),
            logStreaming: this.license.isLogStreamingEnabled(),
            ldap: this.license.isLdapEnabled(),
            saml: this.license.isSamlEnabled(),
            advancedExecutionFilters: this.license.isAdvancedExecutionFiltersEnabled(),
            variables: this.license.isVariablesEnabled(),
            sourceControl: this.license.isSourceControlLicensed(),
            externalSecrets: this.license.isExternalSecretsEnabled(),
            showNonProdBanner: this.license.isFeatureEnabled(constants_1.LICENSE_FEATURES.SHOW_NON_PROD_BANNER),
            debugInEditor: this.license.isDebugInEditorLicensed(),
            binaryDataS3: isS3Available && isS3Selected && isS3Licensed,
            workflowHistory: this.license.isWorkflowHistoryLicensed() && config_2.default.getEnv('workflowHistory.enabled'),
            workerView: this.license.isWorkerViewLicensed(),
            advancedPermissions: this.license.isAdvancedPermissionsLicensed(),
        });
        if (this.license.isLdapEnabled()) {
            Object.assign(this.settings.sso.ldap, {
                loginLabel: (0, helpers_ee_1.getLdapLoginLabel)(),
                loginEnabled: config_2.default.getEnv('sso.ldap.loginEnabled'),
            });
        }
        if (this.license.isSamlEnabled()) {
            Object.assign(this.settings.sso.saml, {
                loginLabel: (0, saml_helpers_1.getSamlLoginLabel)(),
                loginEnabled: config_2.default.getEnv('sso.saml.loginEnabled'),
            });
        }
        if (this.license.isVariablesEnabled()) {
            this.settings.variables.limit = (0, environment_helpers_1.getVariablesLimit)();
        }
        if (this.license.isWorkflowHistoryLicensed() && config_2.default.getEnv('workflowHistory.enabled')) {
            Object.assign(this.settings.workflowHistory, {
                pruneTime: (0, workflow_history_helper_ee_1.getWorkflowHistoryPruneTime)(),
                licensePruneTime: (0, workflow_history_helper_ee_1.getWorkflowHistoryLicensePruneTime)(),
            });
        }
        if (this.communityPackagesService) {
            this.settings.missingPackages = this.communityPackagesService.hasMissingPackages;
        }
        if (isAiAssistantEnabled) {
            this.settings.aiAssistant.enabled = isAiAssistantEnabled;
        }
        if (isAskAiEnabled) {
            this.settings.askAi.enabled = isAskAiEnabled;
        }
        this.settings.mfa.enabled = config_2.default.get('mfa.enabled');
        this.settings.executionMode = config_2.default.getEnv('executions.mode');
        this.settings.binaryDataMode = config_2.default.getEnv('binaryDataManager.mode');
        this.settings.enterprise.projects.team.limit = this.license.getTeamProjectLimit();
        return this.settings;
    }
    writeStaticJSON(name, data) {
        const { staticCacheDir } = this.instanceSettings;
        const filePath = path_1.default.join(staticCacheDir, `types/${name}.json`);
        const stream = (0, fs_1.createWriteStream)(filePath, 'utf-8');
        stream.write('[\n');
        data.forEach((entry, index) => {
            stream.write(JSON.stringify(entry));
            if (index !== data.length - 1)
                stream.write(',');
            stream.write('\n');
        });
        stream.write(']\n');
        stream.end();
    }
    overwriteCredentialsProperties() {
        const { credentials } = this.loadNodesAndCredentials.types;
        const credentialsOverwrites = this.credentialsOverwrites.getAll();
        for (const credential of credentials) {
            const overwrittenProperties = [];
            this.credentialTypes
                .getParentTypes(credential.name)
                .reverse()
                .map((name) => credentialsOverwrites[name])
                .forEach((overwrite) => {
                if (overwrite)
                    overwrittenProperties.push(...Object.keys(overwrite));
            });
            if (credential.name in credentialsOverwrites) {
                overwrittenProperties.push(...Object.keys(credentialsOverwrites[credential.name]));
            }
            if (overwrittenProperties.length) {
                credential.__overwrittenProperties = (0, uniq_1.default)(overwrittenProperties);
            }
        }
    }
    isDocker() {
        try {
            return (node_fs_1.default.existsSync('/.dockerenv') ||
                node_fs_1.default.readFileSync('/proc/self/cgroup', 'utf8').includes('docker'));
        }
        catch {
            return false;
        }
    }
};
exports.FrontendService = FrontendService;
exports.FrontendService = FrontendService = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [config_1.GlobalConfig,
        logger_service_1.Logger,
        load_nodes_and_credentials_1.LoadNodesAndCredentials,
        credential_types_1.CredentialTypes,
        credentials_overwrites_1.CredentialsOverwrites,
        license_1.License,
        email_1.UserManagementMailer,
        n8n_core_1.InstanceSettings,
        url_service_1.UrlService,
        config_1.SecurityConfig,
        config_1.FrontendConfig])
], FrontendService);
//# sourceMappingURL=frontend.service.js.map