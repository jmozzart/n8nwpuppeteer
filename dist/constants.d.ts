import type { n8n } from 'n8n-core';
export declare const inProduction: boolean;
export declare const inDevelopment: boolean;
export declare const inTest: boolean;
export declare const inE2ETests: boolean;
export declare const CUSTOM_API_CALL_NAME = "Custom API Call";
export declare const CUSTOM_API_CALL_KEY = "__CUSTOM_API_CALL__";
export declare const CLI_DIR: string;
export declare const TEMPLATES_DIR: string;
export declare const NODES_BASE_DIR: string;
export declare const EDITOR_UI_DIST_DIR: string;
export declare function getN8nPackageJson(): n8n.PackageJson;
export declare const STARTING_NODES: string[];
export declare const N8N_VERSION: string;
export declare const NODE_PACKAGE_PREFIX = "n8n-nodes-";
export declare const STARTER_TEMPLATE_NAME = "n8n-nodes-starter";
export declare const RESPONSE_ERROR_MESSAGES: {
    readonly NO_CREDENTIAL: "Credential not found";
    readonly NO_NODE: "Node not found";
    readonly PACKAGE_NAME_NOT_PROVIDED: "Package name is required";
    readonly PACKAGE_NAME_NOT_VALID: "Package name is not valid - it must start with \"n8n-nodes-\"";
    readonly PACKAGE_NOT_INSTALLED: "This package is not installed - you must install it first";
    readonly PACKAGE_FAILED_TO_INSTALL: "Package could not be installed - check logs for details";
    readonly PACKAGE_NOT_FOUND: "Package not found in npm";
    readonly PACKAGE_VERSION_NOT_FOUND: "The specified package version was not found";
    readonly PACKAGE_DOES_NOT_CONTAIN_NODES: "The specified package does not contain any nodes";
    readonly PACKAGE_LOADING_FAILED: "The specified package could not be loaded";
    readonly DISK_IS_FULL: "There appears to be insufficient disk space";
    readonly USERS_QUOTA_REACHED: "Maximum number of users reached";
    readonly OAUTH2_CREDENTIAL_TEST_SUCCEEDED: "Connection Successful!";
    readonly OAUTH2_CREDENTIAL_TEST_FAILED: "This OAuth2 credential was not connected to an account.";
    readonly MISSING_SCOPE: "User is missing a scope required to perform this action";
};
export declare const AUTH_COOKIE_NAME = "n8n-auth";
export declare const NPM_COMMAND_TOKENS: {
    NPM_PACKAGE_NOT_FOUND_ERROR: string;
    NPM_PACKAGE_VERSION_NOT_FOUND_ERROR: string;
    NPM_NO_VERSION_AVAILABLE: string;
    NPM_DISK_NO_SPACE: string;
    NPM_DISK_INSUFFICIENT_SPACE: string;
};
export declare const NPM_PACKAGE_STATUS_GOOD = "OK";
export declare const UNKNOWN_FAILURE_REASON = "Unknown failure reason";
export declare const WORKFLOW_REACTIVATE_INITIAL_TIMEOUT = 1000;
export declare const WORKFLOW_REACTIVATE_MAX_TIMEOUT: number;
export declare const SETTINGS_LICENSE_CERT_KEY = "license.cert";
export declare const LICENSE_FEATURES: {
    readonly SHARING: "feat:sharing";
    readonly LDAP: "feat:ldap";
    readonly SAML: "feat:saml";
    readonly LOG_STREAMING: "feat:logStreaming";
    readonly ADVANCED_EXECUTION_FILTERS: "feat:advancedExecutionFilters";
    readonly VARIABLES: "feat:variables";
    readonly SOURCE_CONTROL: "feat:sourceControl";
    readonly API_DISABLED: "feat:apiDisabled";
    readonly EXTERNAL_SECRETS: "feat:externalSecrets";
    readonly SHOW_NON_PROD_BANNER: "feat:showNonProdBanner";
    readonly WORKFLOW_HISTORY: "feat:workflowHistory";
    readonly DEBUG_IN_EDITOR: "feat:debugInEditor";
    readonly BINARY_DATA_S3: "feat:binaryDataS3";
    readonly MULTIPLE_MAIN_INSTANCES: "feat:multipleMainInstances";
    readonly WORKER_VIEW: "feat:workerView";
    readonly ADVANCED_PERMISSIONS: "feat:advancedPermissions";
    readonly PROJECT_ROLE_ADMIN: "feat:projectRole:admin";
    readonly PROJECT_ROLE_EDITOR: "feat:projectRole:editor";
    readonly PROJECT_ROLE_VIEWER: "feat:projectRole:viewer";
    readonly AI_ASSISTANT: "feat:aiAssistant";
    readonly ASK_AI: "feat:askAi";
    readonly COMMUNITY_NODES_CUSTOM_REGISTRY: "feat:communityNodes:customRegistry";
};
export declare const LICENSE_QUOTAS: {
    readonly TRIGGER_LIMIT: "quota:activeWorkflows";
    readonly VARIABLES_LIMIT: "quota:maxVariables";
    readonly USERS_LIMIT: "quota:users";
    readonly WORKFLOW_HISTORY_PRUNE_LIMIT: "quota:workflowHistoryPrune";
    readonly TEAM_PROJECT_LIMIT: "quota:maxTeamProjects";
};
export declare const UNLIMITED_LICENSE_QUOTA = -1;
export declare const CREDENTIAL_BLANKING_VALUE = "__n8n_BLANK_VALUE_e5362baf-c777-4d57-a609-6eaf1f9e87f6";
export declare const UM_FIX_INSTRUCTION = "Please fix the database by running ./packages/cli/bin/n8n user-management:reset";
export declare const Time: {
    milliseconds: {
        toMinutes: number;
        toSeconds: number;
    };
    seconds: {
        toMilliseconds: number;
    };
    minutes: {
        toMilliseconds: number;
    };
    hours: {
        toMilliseconds: number;
        toSeconds: number;
    };
    days: {
        toSeconds: number;
        toMilliseconds: number;
    };
};
export declare const MIN_PASSWORD_CHAR_LENGTH = 8;
export declare const MAX_PASSWORD_CHAR_LENGTH = 64;
export declare const TEST_WEBHOOK_TIMEOUT: number;
export declare const TEST_WEBHOOK_TIMEOUT_BUFFER: number;
export declare const GENERIC_OAUTH2_CREDENTIALS_WITH_EDITABLE_SCOPE: string[];
export declare const ARTIFICIAL_TASK_DATA: {
    main: {
        json: {
            isArtificialRecoveredEventItem: boolean;
        };
        pairedItem: undefined;
    }[][];
};
export declare const LOWEST_SHUTDOWN_PRIORITY = 0;
export declare const DEFAULT_SHUTDOWN_PRIORITY = 100;
export declare const HIGHEST_SHUTDOWN_PRIORITY = 200;
