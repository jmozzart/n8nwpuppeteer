"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HIGHEST_SHUTDOWN_PRIORITY = exports.DEFAULT_SHUTDOWN_PRIORITY = exports.LOWEST_SHUTDOWN_PRIORITY = exports.ARTIFICIAL_TASK_DATA = exports.GENERIC_OAUTH2_CREDENTIALS_WITH_EDITABLE_SCOPE = exports.TEST_WEBHOOK_TIMEOUT_BUFFER = exports.TEST_WEBHOOK_TIMEOUT = exports.MAX_PASSWORD_CHAR_LENGTH = exports.MIN_PASSWORD_CHAR_LENGTH = exports.Time = exports.UM_FIX_INSTRUCTION = exports.CREDENTIAL_BLANKING_VALUE = exports.UNLIMITED_LICENSE_QUOTA = exports.LICENSE_QUOTAS = exports.LICENSE_FEATURES = exports.SETTINGS_LICENSE_CERT_KEY = exports.WORKFLOW_REACTIVATE_MAX_TIMEOUT = exports.WORKFLOW_REACTIVATE_INITIAL_TIMEOUT = exports.UNKNOWN_FAILURE_REASON = exports.NPM_PACKAGE_STATUS_GOOD = exports.NPM_COMMAND_TOKENS = exports.AUTH_COOKIE_NAME = exports.RESPONSE_ERROR_MESSAGES = exports.STARTER_TEMPLATE_NAME = exports.NODE_PACKAGE_PREFIX = exports.N8N_VERSION = exports.STARTING_NODES = exports.EDITOR_UI_DIST_DIR = exports.NODES_BASE_DIR = exports.TEMPLATES_DIR = exports.CLI_DIR = exports.CUSTOM_API_CALL_KEY = exports.CUSTOM_API_CALL_NAME = exports.inE2ETests = exports.inTest = exports.inDevelopment = exports.inProduction = void 0;
exports.getN8nPackageJson = getN8nPackageJson;
const fs_1 = require("fs");
const n8n_workflow_1 = require("n8n-workflow");
const path_1 = require("path");
const { NODE_ENV, E2E_TESTS } = process.env;
exports.inProduction = NODE_ENV === 'production';
exports.inDevelopment = !NODE_ENV || NODE_ENV === 'development';
exports.inTest = NODE_ENV === 'test';
exports.inE2ETests = E2E_TESTS === 'true';
exports.CUSTOM_API_CALL_NAME = 'Custom API Call';
exports.CUSTOM_API_CALL_KEY = '__CUSTOM_API_CALL__';
exports.CLI_DIR = (0, path_1.resolve)(__dirname, '..');
exports.TEMPLATES_DIR = (0, path_1.join)(exports.CLI_DIR, 'templates');
exports.NODES_BASE_DIR = (0, path_1.dirname)(require.resolve('n8n-nodes-base'));
exports.EDITOR_UI_DIST_DIR = (0, path_1.join)((0, path_1.dirname)(require.resolve('n8n-editor-ui')), 'dist');
function getN8nPackageJson() {
    return (0, n8n_workflow_1.jsonParse)((0, fs_1.readFileSync)((0, path_1.join)(exports.CLI_DIR, 'package.json'), 'utf8'));
}
exports.STARTING_NODES = [
    '@n8n/n8n-nodes-langchain.manualChatTrigger',
    'n8n-nodes-base.start',
    'n8n-nodes-base.manualTrigger',
];
exports.N8N_VERSION = getN8nPackageJson().version;
exports.NODE_PACKAGE_PREFIX = 'n8n-nodes-';
exports.STARTER_TEMPLATE_NAME = `${exports.NODE_PACKAGE_PREFIX}starter`;
exports.RESPONSE_ERROR_MESSAGES = {
    NO_CREDENTIAL: 'Credential not found',
    NO_NODE: 'Node not found',
    PACKAGE_NAME_NOT_PROVIDED: 'Package name is required',
    PACKAGE_NAME_NOT_VALID: `Package name is not valid - it must start with "${exports.NODE_PACKAGE_PREFIX}"`,
    PACKAGE_NOT_INSTALLED: 'This package is not installed - you must install it first',
    PACKAGE_FAILED_TO_INSTALL: 'Package could not be installed - check logs for details',
    PACKAGE_NOT_FOUND: 'Package not found in npm',
    PACKAGE_VERSION_NOT_FOUND: 'The specified package version was not found',
    PACKAGE_DOES_NOT_CONTAIN_NODES: 'The specified package does not contain any nodes',
    PACKAGE_LOADING_FAILED: 'The specified package could not be loaded',
    DISK_IS_FULL: 'There appears to be insufficient disk space',
    USERS_QUOTA_REACHED: 'Maximum number of users reached',
    OAUTH2_CREDENTIAL_TEST_SUCCEEDED: 'Connection Successful!',
    OAUTH2_CREDENTIAL_TEST_FAILED: 'This OAuth2 credential was not connected to an account.',
    MISSING_SCOPE: 'User is missing a scope required to perform this action',
};
exports.AUTH_COOKIE_NAME = 'n8n-auth';
exports.NPM_COMMAND_TOKENS = {
    NPM_PACKAGE_NOT_FOUND_ERROR: '404 Not Found',
    NPM_PACKAGE_VERSION_NOT_FOUND_ERROR: 'No matching version found for',
    NPM_NO_VERSION_AVAILABLE: 'No valid versions available',
    NPM_DISK_NO_SPACE: 'ENOSPC',
    NPM_DISK_INSUFFICIENT_SPACE: 'insufficient space',
};
exports.NPM_PACKAGE_STATUS_GOOD = 'OK';
exports.UNKNOWN_FAILURE_REASON = 'Unknown failure reason';
exports.WORKFLOW_REACTIVATE_INITIAL_TIMEOUT = 1000;
exports.WORKFLOW_REACTIVATE_MAX_TIMEOUT = 24 * 60 * 60 * 1000;
exports.SETTINGS_LICENSE_CERT_KEY = 'license.cert';
exports.LICENSE_FEATURES = {
    SHARING: 'feat:sharing',
    LDAP: 'feat:ldap',
    SAML: 'feat:saml',
    LOG_STREAMING: 'feat:logStreaming',
    ADVANCED_EXECUTION_FILTERS: 'feat:advancedExecutionFilters',
    VARIABLES: 'feat:variables',
    SOURCE_CONTROL: 'feat:sourceControl',
    API_DISABLED: 'feat:apiDisabled',
    EXTERNAL_SECRETS: 'feat:externalSecrets',
    SHOW_NON_PROD_BANNER: 'feat:showNonProdBanner',
    WORKFLOW_HISTORY: 'feat:workflowHistory',
    DEBUG_IN_EDITOR: 'feat:debugInEditor',
    BINARY_DATA_S3: 'feat:binaryDataS3',
    MULTIPLE_MAIN_INSTANCES: 'feat:multipleMainInstances',
    WORKER_VIEW: 'feat:workerView',
    ADVANCED_PERMISSIONS: 'feat:advancedPermissions',
    PROJECT_ROLE_ADMIN: 'feat:projectRole:admin',
    PROJECT_ROLE_EDITOR: 'feat:projectRole:editor',
    PROJECT_ROLE_VIEWER: 'feat:projectRole:viewer',
    AI_ASSISTANT: 'feat:aiAssistant',
    ASK_AI: 'feat:askAi',
    COMMUNITY_NODES_CUSTOM_REGISTRY: 'feat:communityNodes:customRegistry',
};
exports.LICENSE_QUOTAS = {
    TRIGGER_LIMIT: 'quota:activeWorkflows',
    VARIABLES_LIMIT: 'quota:maxVariables',
    USERS_LIMIT: 'quota:users',
    WORKFLOW_HISTORY_PRUNE_LIMIT: 'quota:workflowHistoryPrune',
    TEAM_PROJECT_LIMIT: 'quota:maxTeamProjects',
};
exports.UNLIMITED_LICENSE_QUOTA = -1;
exports.CREDENTIAL_BLANKING_VALUE = '__n8n_BLANK_VALUE_e5362baf-c777-4d57-a609-6eaf1f9e87f6';
exports.UM_FIX_INSTRUCTION = 'Please fix the database by running ./packages/cli/bin/n8n user-management:reset';
exports.Time = {
    milliseconds: {
        toMinutes: 1 / (60 * 1000),
        toSeconds: 1 / 1000,
    },
    seconds: {
        toMilliseconds: 1000,
    },
    minutes: {
        toMilliseconds: 60 * 1000,
    },
    hours: {
        toMilliseconds: 60 * 60 * 1000,
        toSeconds: 60 * 60,
    },
    days: {
        toSeconds: 24 * 60 * 60,
        toMilliseconds: 24 * 60 * 60 * 1000,
    },
};
exports.MIN_PASSWORD_CHAR_LENGTH = 8;
exports.MAX_PASSWORD_CHAR_LENGTH = 64;
exports.TEST_WEBHOOK_TIMEOUT = 2 * exports.Time.minutes.toMilliseconds;
exports.TEST_WEBHOOK_TIMEOUT_BUFFER = 30 * exports.Time.seconds.toMilliseconds;
exports.GENERIC_OAUTH2_CREDENTIALS_WITH_EDITABLE_SCOPE = [
    'oAuth2Api',
    'googleOAuth2Api',
    'microsoftOAuth2Api',
    'highLevelOAuth2Api',
];
exports.ARTIFICIAL_TASK_DATA = {
    main: [
        [
            {
                json: { isArtificialRecoveredEventItem: true },
                pairedItem: undefined,
            },
        ],
    ],
};
exports.LOWEST_SHUTDOWN_PRIORITY = 0;
exports.DEFAULT_SHUTDOWN_PRIORITY = 100;
exports.HIGHEST_SHUTDOWN_PRIORITY = 200;
//# sourceMappingURL=constants.js.map