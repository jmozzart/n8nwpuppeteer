import type { RunningMode } from '../databases/entities/auth-provider-sync-history';
import type { AuthenticatedRequest } from '../requests';
export type ConnectionSecurity = 'none' | 'tls' | 'startTls';
export interface LdapConfig {
    loginEnabled: boolean;
    loginLabel: string;
    connectionUrl: string;
    allowUnauthorizedCerts: boolean;
    connectionSecurity: ConnectionSecurity;
    connectionPort: number;
    baseDn: string;
    bindingAdminDn: string;
    bindingAdminPassword: string;
    firstNameAttribute: string;
    lastNameAttribute: string;
    emailAttribute: string;
    loginIdAttribute: string;
    ldapIdAttribute: string;
    userFilter: string;
    synchronizationEnabled: boolean;
    synchronizationInterval: number;
    searchPageSize: number;
    searchTimeout: number;
}
export declare namespace LdapConfiguration {
    type Update = AuthenticatedRequest<{}, {}, LdapConfig, {}>;
    type Sync = AuthenticatedRequest<{}, {}, {
        type: RunningMode;
    }, {}>;
    type GetSync = AuthenticatedRequest<{}, {}, {}, {
        page?: string;
        perPage?: string;
    }>;
}
