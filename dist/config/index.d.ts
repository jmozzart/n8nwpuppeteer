import convict from 'convict';
declare const config: convict.Config<{
    executions: {
        process: string;
        mode: string;
        concurrency: {
            productionLimit: number;
        };
        timeout: number;
        maxTimeout: number;
        saveDataOnError: string;
        saveDataOnSuccess: string;
        saveExecutionProgress: boolean;
        saveDataManualExecutions: boolean;
        queueRecovery: {
            interval: number;
            batchSize: number;
        };
    };
    secure_cookie: boolean;
    ssl_key: string;
    ssl_cert: string;
    editorBaseUrl: string;
    workflowTagsDisabled: boolean;
    userManagement: {
        jwtSecret: string;
        jwtSessionDurationHours: number;
        jwtRefreshTimeoutHours: number;
        isInstanceOwnerSetUp: boolean;
        authenticationMethod: string;
    };
    externalFrontendHooksUrls: string;
    externalHookFiles: string;
    push: {
        backend: string;
    };
    binaryDataManager: {
        availableModes: string;
        mode: string;
        localStoragePath: string;
    };
    deployment: {
        type: string;
    };
    mfa: {
        enabled: boolean;
    };
    sso: {
        justInTimeProvisioning: boolean;
        redirectLoginToSso: boolean;
        saml: {
            loginEnabled: boolean;
            loginLabel: string;
        };
        ldap: {
            loginEnabled: boolean;
            loginLabel: string;
        };
    };
    hiringBanner: {
        enabled: boolean;
    };
    personalization: {
        enabled: boolean;
    };
    defaultLocale: string;
    hideUsagePage: boolean;
    redis: {
        prefix: string;
    };
    endpoints: {
        rest: string;
    };
    ai: {
        enabled: boolean;
    };
    aiAssistant: {
        baseUrl: string;
    };
    expression: {
        evaluator: string;
        reportDifference: boolean;
    };
    sourceControl: {
        defaultKeyPairType: string;
    };
    workflowHistory: {
        enabled: boolean;
        pruneTime: number;
    };
    proxy_hops: number;
    featureFlags: {
        partialExecutionVersionDefault: string;
    };
}>;
export default config;
