import { GlobalConfig } from '@n8n/config';
import { InstanceSettings } from 'n8n-core';
import { MultiMainSetup } from '../scaling/multi-main-setup.ee';
export declare class OrchestrationService {
    readonly instanceSettings: InstanceSettings;
    readonly multiMainSetup: MultiMainSetup;
    readonly globalConfig: GlobalConfig;
    constructor(instanceSettings: InstanceSettings, multiMainSetup: MultiMainSetup, globalConfig: GlobalConfig);
    private publisher;
    private subscriber;
    isInitialized: boolean;
    private isMultiMainSetupLicensed;
    setMultiMainSetupLicensed(newState: boolean): void;
    get isMultiMainSetupEnabled(): boolean;
    get isSingleMainSetup(): boolean;
    sanityCheck(): boolean;
    init(): Promise<void>;
    shutdown(): Promise<void>;
}
