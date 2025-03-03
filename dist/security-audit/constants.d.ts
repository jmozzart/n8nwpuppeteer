import type { Risk } from '../security-audit/types';
export declare const RISK_CATEGORIES: Risk.Category[];
export declare const SQL_NODE_TYPES_WITH_QUERY_PARAMS: Set<string>;
export declare const SQL_NODE_TYPES: Set<string>;
export declare const WEBHOOK_NODE_TYPE = "n8n-nodes-base.webhook";
export declare const WEBHOOK_VALIDATOR_NODE_TYPES: Set<string>;
export declare const FILESYSTEM_INTERACTION_NODE_TYPES: Set<string>;
export declare const OFFICIAL_RISKY_NODE_TYPES: Set<string>;
export declare const DATABASE_REPORT: {
    readonly RISK: "database";
    readonly SECTIONS: {
        readonly EXPRESSIONS_IN_QUERIES: "Expressions in \"Execute Query\" fields in SQL nodes";
        readonly EXPRESSIONS_IN_QUERY_PARAMS: "Expressions in \"Query Parameters\" fields in SQL nodes";
        readonly UNUSED_QUERY_PARAMS: "Unused \"Query Parameters\" fields in SQL nodes";
    };
};
export declare const CREDENTIALS_REPORT: {
    readonly RISK: "credentials";
    readonly SECTIONS: {
        readonly CREDS_NOT_IN_ANY_USE: "Credentials not used in any workflow";
        readonly CREDS_NOT_IN_ACTIVE_USE: "Credentials not used in any active workflow";
        readonly CREDS_NOT_RECENTLY_EXECUTED: "Credentials not used in recently executed workflows";
    };
};
export declare const FILESYSTEM_REPORT: {
    readonly RISK: "filesystem";
    readonly SECTIONS: {
        readonly FILESYSTEM_INTERACTION_NODES: "Nodes that interact with the filesystem";
    };
};
export declare const NODES_REPORT: {
    readonly RISK: "nodes";
    readonly SECTIONS: {
        readonly OFFICIAL_RISKY_NODES: "Official risky nodes";
        readonly COMMUNITY_NODES: "Community nodes";
        readonly CUSTOM_NODES: "Custom nodes";
    };
};
export declare const INSTANCE_REPORT: {
    readonly RISK: "instance";
    readonly SECTIONS: {
        readonly UNPROTECTED_WEBHOOKS: "Unprotected webhooks in instance";
        readonly OUTDATED_INSTANCE: "Outdated instance";
        readonly SECURITY_SETTINGS: "Security settings";
    };
};
export declare const ENV_VARS_DOCS_URL = "https://docs.n8n.io/reference/environment-variables.html";
export declare const DB_QUERY_PARAMS_DOCS_URL = "https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.postgres#use-query-parameters";
export declare const COMMUNITY_NODES_RISKS_URL = "https://docs.n8n.io/integrations/community-nodes/risks";
export declare const NPM_PACKAGE_URL = "https://www.npmjs.com/package";
