export declare const schema: {
    executions: {
        process: {
            doc: string;
            format: StringConstructor;
            default: string;
            env: string;
        };
        mode: {
            doc: string;
            format: readonly ["regular", "queue"];
            default: string;
            env: string;
        };
        concurrency: {
            productionLimit: {
                doc: string;
                format: NumberConstructor;
                default: number;
                env: string;
            };
        };
        timeout: {
            doc: string;
            format: NumberConstructor;
            default: number;
            env: string;
        };
        maxTimeout: {
            doc: string;
            format: NumberConstructor;
            default: number;
            env: string;
        };
        saveDataOnError: {
            doc: string;
            format: readonly ["all", "none"];
            default: string;
            env: string;
        };
        saveDataOnSuccess: {
            doc: string;
            format: readonly ["all", "none"];
            default: string;
            env: string;
        };
        saveExecutionProgress: {
            doc: string;
            format: BooleanConstructor;
            default: boolean;
            env: string;
        };
        saveDataManualExecutions: {
            doc: string;
            format: BooleanConstructor;
            default: boolean;
            env: string;
        };
        queueRecovery: {
            interval: {
                doc: string;
                format: NumberConstructor;
                default: number;
                env: string;
            };
            batchSize: {
                doc: string;
                format: NumberConstructor;
                default: number;
                env: string;
            };
        };
    };
    secure_cookie: {
        doc: string;
        format: BooleanConstructor;
        default: boolean;
        env: string;
    };
    ssl_key: {
        format: StringConstructor;
        default: string;
        env: string;
        doc: string;
    };
    ssl_cert: {
        format: StringConstructor;
        default: string;
        env: string;
        doc: string;
    };
    editorBaseUrl: {
        format: StringConstructor;
        default: string;
        env: string;
        doc: string;
    };
    workflowTagsDisabled: {
        format: BooleanConstructor;
        default: boolean;
        env: string;
        doc: string;
    };
    userManagement: {
        jwtSecret: {
            doc: string;
            format: StringConstructor;
            default: string;
            env: string;
        };
        jwtSessionDurationHours: {
            doc: string;
            format: NumberConstructor;
            default: number;
            env: string;
        };
        jwtRefreshTimeoutHours: {
            doc: string;
            format: NumberConstructor;
            default: number;
            env: string;
        };
        isInstanceOwnerSetUp: {
            doc: string;
            format: BooleanConstructor;
            default: boolean;
        };
        authenticationMethod: {
            doc: string;
            format: readonly ["email", "ldap", "saml"];
            default: string;
        };
    };
    externalFrontendHooksUrls: {
        doc: string;
        format: StringConstructor;
        default: string;
        env: string;
    };
    externalHookFiles: {
        doc: string;
        format: StringConstructor;
        default: string;
        env: string;
    };
    push: {
        backend: {
            format: readonly ["sse", "websocket"];
            default: string;
            env: string;
            doc: string;
        };
    };
    binaryDataManager: {
        availableModes: {
            format: string;
            default: string;
            env: string;
            doc: string;
        };
        mode: {
            format: readonly ["default", "filesystem", "s3"];
            default: string;
            env: string;
            doc: string;
        };
        localStoragePath: {
            format: StringConstructor;
            default: string;
            env: string;
            doc: string;
        };
    };
    deployment: {
        type: {
            format: StringConstructor;
            default: string;
            env: string;
        };
    };
    mfa: {
        enabled: {
            format: BooleanConstructor;
            default: boolean;
            doc: string;
            env: string;
        };
    };
    sso: {
        justInTimeProvisioning: {
            format: BooleanConstructor;
            default: boolean;
            doc: string;
        };
        redirectLoginToSso: {
            format: BooleanConstructor;
            default: boolean;
            doc: string;
        };
        saml: {
            loginEnabled: {
                format: BooleanConstructor;
                default: boolean;
                doc: string;
            };
            loginLabel: {
                format: StringConstructor;
                default: string;
            };
        };
        ldap: {
            loginEnabled: {
                format: BooleanConstructor;
                default: boolean;
            };
            loginLabel: {
                format: StringConstructor;
                default: string;
            };
        };
    };
    hiringBanner: {
        enabled: {
            doc: string;
            format: BooleanConstructor;
            default: boolean;
            env: string;
        };
    };
    personalization: {
        enabled: {
            doc: string;
            format: BooleanConstructor;
            default: boolean;
            env: string;
        };
    };
    defaultLocale: {
        doc: string;
        format: StringConstructor;
        default: string;
        env: string;
    };
    hideUsagePage: {
        format: BooleanConstructor;
        default: boolean;
        env: string;
        doc: string;
    };
    redis: {
        prefix: {
            doc: string;
            format: StringConstructor;
            default: string;
            env: string;
        };
    };
    endpoints: {
        rest: {
            format: StringConstructor;
            default: string;
        };
    };
    ai: {
        enabled: {
            doc: string;
            format: BooleanConstructor;
            default: boolean;
            env: string;
        };
    };
    aiAssistant: {
        baseUrl: {
            doc: string;
            format: StringConstructor;
            default: string;
            env: string;
        };
    };
    expression: {
        evaluator: {
            doc: string;
            format: readonly ["tmpl", "tournament"];
            default: string;
            env: string;
        };
        reportDifference: {
            doc: string;
            format: BooleanConstructor;
            default: boolean;
            env: string;
        };
    };
    sourceControl: {
        defaultKeyPairType: {
            doc: string;
            format: readonly ["rsa", "ed25519"];
            default: string;
            env: string;
        };
    };
    workflowHistory: {
        enabled: {
            doc: string;
            format: BooleanConstructor;
            default: boolean;
            env: string;
        };
        pruneTime: {
            doc: string;
            format: NumberConstructor;
            default: number;
            env: string;
        };
    };
    proxy_hops: {
        format: NumberConstructor;
        default: number;
        env: string;
        doc: string;
    };
    featureFlags: {
        partialExecutionVersionDefault: {
            format: StringConstructor;
            default: string;
            env: string;
            doc: string;
        };
    };
};
