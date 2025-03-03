import { AuthProviderType } from './auth-identity';
export type RunningMode = 'dry' | 'live';
export type SyncStatus = 'success' | 'error';
export declare class AuthProviderSyncHistory {
    id: number;
    providerType: AuthProviderType;
    runMode: RunningMode;
    status: SyncStatus;
    startedAt: Date;
    endedAt: Date;
    scanned: number;
    created: number;
    updated: number;
    disabled: number;
    error: string;
}
