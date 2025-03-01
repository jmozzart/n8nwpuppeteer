"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@n8n/config");
const convict_1 = __importDefault(require("convict"));
const flat_1 = require("flat");
const fs_1 = require("fs");
const merge_1 = __importDefault(require("lodash/merge"));
const n8n_workflow_1 = require("n8n-workflow");
const picocolors_1 = __importDefault(require("picocolors"));
const typedi_1 = require("typedi");
const constants_1 = require("../constants");
if (constants_1.inE2ETests) {
    process.env.N8N_DIAGNOSTICS_ENABLED = 'false';
    process.env.N8N_PUBLIC_API_DISABLED = 'true';
    process.env.EXTERNAL_FRONTEND_HOOKS_URLS = '';
    process.env.N8N_PERSONALIZATION_ENABLED = 'false';
    process.env.N8N_AI_ENABLED = 'true';
}
else if (constants_1.inTest) {
    process.env.N8N_LOG_LEVEL = 'silent';
    process.env.N8N_PUBLIC_API_DISABLED = 'true';
    process.env.SKIP_STATISTICS_EVENTS = 'true';
    process.env.N8N_SECURE_COOKIE = 'false';
    process.env.N8N_SKIP_AUTH_ON_OAUTH_CALLBACK = 'true';
}
const schema_1 = require("./schema");
const config = (0, convict_1.default)(schema_1.schema, { args: [] });
config.getEnv = config.get;
if (!constants_1.inE2ETests && !constants_1.inTest) {
    const { N8N_CONFIG_FILES } = process.env;
    if (N8N_CONFIG_FILES !== undefined) {
        const globalConfig = typedi_1.Container.get(config_1.GlobalConfig);
        const configFiles = N8N_CONFIG_FILES.split(',');
        for (const configFile of configFiles) {
            if (!configFile)
                continue;
            try {
                const data = JSON.parse((0, fs_1.readFileSync)(configFile, 'utf8'));
                for (const prefix in data) {
                    const innerData = data[prefix];
                    if (prefix in globalConfig) {
                        (0, merge_1.default)(globalConfig[prefix], innerData);
                    }
                    else {
                        const flattenedData = (0, flat_1.flatten)(innerData);
                        for (const key in flattenedData) {
                            config.set(`${prefix}.${key}`, flattenedData[key]);
                        }
                    }
                }
                console.debug('Loaded config overwrites from', configFile);
            }
            catch (error) {
                console.error('Error loading config file', configFile, error);
            }
        }
    }
    Object.entries(process.env).forEach(([envName, fileName]) => {
        if (envName.endsWith('_FILE') && fileName) {
            const configEnvName = envName.replace(/_FILE$/, '');
            const key = config._env[configEnvName]?.[0];
            if (key) {
                let value;
                try {
                    value = (0, fs_1.readFileSync)(fileName, 'utf8');
                }
                catch (error) {
                    if (error.code === 'ENOENT') {
                        throw new n8n_workflow_1.ApplicationError('File not found', { extra: { fileName } });
                    }
                    throw error;
                }
                config.set(key, value);
            }
        }
    });
}
config.validate({
    allowed: 'strict',
});
const userManagement = config.get('userManagement');
if (userManagement.jwtRefreshTimeoutHours >= userManagement.jwtSessionDurationHours) {
    if (!constants_1.inTest)
        console.warn('N8N_USER_MANAGEMENT_JWT_REFRESH_TIMEOUT_HOURS needs to smaller than N8N_USER_MANAGEMENT_JWT_DURATION_HOURS. Setting N8N_USER_MANAGEMENT_JWT_REFRESH_TIMEOUT_HOURS to 0 for now.');
    config.set('userManagement.jwtRefreshTimeoutHours', 0);
}
const executionProcess = config.getEnv('executions.process');
if (executionProcess) {
    console.error(picocolors_1.default.yellow('Please unset the deprecated env variable'), picocolors_1.default.bold(picocolors_1.default.yellow('EXECUTIONS_PROCESS')));
}
if (executionProcess === 'own') {
    console.error(picocolors_1.default.bold(picocolors_1.default.red('Application failed to start because "Own" mode has been removed.')));
    console.error(picocolors_1.default.red('If you need the isolation and performance gains, please consider using queue mode instead.\n\n'));
    process.exit(-1);
}
(0, n8n_workflow_1.setGlobalState)({
    defaultTimezone: typedi_1.Container.get(config_1.GlobalConfig).generic.timezone,
});
exports.default = config;
//# sourceMappingURL=index.js.map