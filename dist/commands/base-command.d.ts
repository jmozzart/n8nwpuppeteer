import 'reflect-metadata';
import { GlobalConfig } from '@n8n/config';
import { Command } from '@oclif/core';
import { InstanceSettings } from 'n8n-core';
import type { AbstractServer } from '../abstract-server';
import { ExternalHooks } from '../external-hooks';
import { License } from '../license';
import { Logger } from '../logging/logger.service';
import { NodeTypes } from '../node-types';
import { ShutdownService } from '../shutdown/shutdown.service';
export declare abstract class BaseCommand extends Command {
    protected logger: Logger;
    protected externalHooks?: ExternalHooks;
    protected nodeTypes: NodeTypes;
    protected instanceSettings: InstanceSettings;
    protected server?: AbstractServer;
    protected shutdownService: ShutdownService;
    protected license: License;
    protected readonly globalConfig: GlobalConfig;
    protected gracefulShutdownTimeoutInS: number;
    protected needsCommunityPackages: boolean;
    init(): Promise<void>;
    protected stopProcess(): Promise<void>;
    protected initCrashJournal(): Promise<void>;
    protected exitSuccessFully(): Promise<void>;
    protected exitWithCrash(message: string, error: unknown): Promise<void>;
    initObjectStoreService(): Promise<void>;
    private _initObjectStoreService;
    initBinaryDataService(): Promise<void>;
    protected initDataDeduplicationService(): Promise<void>;
    initExternalHooks(): Promise<void>;
    initLicense(): Promise<void>;
    initExternalSecrets(): Promise<void>;
    initWorkflowHistory(): void;
    finally(error: Error | undefined): Promise<void>;
    protected onTerminationSignal(signal: string): () => Promise<void>;
}
