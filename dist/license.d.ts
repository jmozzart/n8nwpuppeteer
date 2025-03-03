import { GlobalConfig } from '@n8n/config';
import type { TEntitlement, TFeatures, TLicenseBlock } from '@n8n_io/license-sdk';
import { InstanceSettings } from 'n8n-core';
import { SettingsRepository } from './databases/repositories/settings.repository';
import { Logger } from './logging/logger.service';
import { LicenseMetricsService } from './metrics/license-metrics.service';
import { OrchestrationService } from './services/orchestration.service';
import type { BooleanLicenseFeature, NumericLicenseFeature } from './interfaces';
export type FeatureReturnType = Partial<{
    planName: string;
} & {
    [K in NumericLicenseFeature]: number;
} & {
    [K in BooleanLicenseFeature]: boolean;
}>;
export declare class License {
    private readonly logger;
    private readonly instanceSettings;
    private readonly orchestrationService;
    private readonly settingsRepository;
    private readonly licenseMetricsService;
    private readonly globalConfig;
    private manager;
    private isShuttingDown;
    constructor(logger: Logger, instanceSettings: InstanceSettings, orchestrationService: OrchestrationService, settingsRepository: SettingsRepository, licenseMetricsService: LicenseMetricsService, globalConfig: GlobalConfig);
    private renewalEnabled;
    init(forceRecreate?: boolean): Promise<void>;
    loadCertStr(): Promise<TLicenseBlock>;
    onFeatureChange(_features: TFeatures): Promise<void>;
    saveCertStr(value: TLicenseBlock): Promise<void>;
    activate(activationKey: string): Promise<void>;
    reload(): Promise<void>;
    renew(): Promise<void>;
    shutdown(): Promise<void>;
    isFeatureEnabled(feature: BooleanLicenseFeature): boolean;
    isSharingEnabled(): boolean;
    isLogStreamingEnabled(): boolean;
    isLdapEnabled(): boolean;
    isSamlEnabled(): boolean;
    isAiAssistantEnabled(): boolean;
    isAskAiEnabled(): boolean;
    isAdvancedExecutionFiltersEnabled(): boolean;
    isAdvancedPermissionsLicensed(): boolean;
    isDebugInEditorLicensed(): boolean;
    isBinaryDataS3Licensed(): boolean;
    isMultipleMainInstancesLicensed(): boolean;
    isVariablesEnabled(): boolean;
    isSourceControlLicensed(): boolean;
    isExternalSecretsEnabled(): boolean;
    isWorkflowHistoryLicensed(): boolean;
    isAPIDisabled(): boolean;
    isWorkerViewLicensed(): boolean;
    isProjectRoleAdminLicensed(): boolean;
    isProjectRoleEditorLicensed(): boolean;
    isProjectRoleViewerLicensed(): boolean;
    isCustomNpmRegistryEnabled(): boolean;
    getCurrentEntitlements(): TEntitlement[];
    getFeatureValue<T extends keyof FeatureReturnType>(feature: T): FeatureReturnType[T];
    getManagementJwt(): string;
    getMainPlan(): TEntitlement | undefined;
    getConsumerId(): string;
    getUsersLimit(): number;
    getTriggerLimit(): number;
    getVariablesLimit(): number;
    getWorkflowHistoryPruneLimit(): number;
    getTeamProjectLimit(): number;
    getPlanName(): string;
    getInfo(): string;
    isWithinUsersLimit(): boolean;
    reinit(): Promise<void>;
}
