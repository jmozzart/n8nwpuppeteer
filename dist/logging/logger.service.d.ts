import type { LogScope } from '@n8n/config';
import { GlobalConfig } from '@n8n/config';
import { InstanceSettings } from 'n8n-core';
import winston from 'winston';
import type { LogMetadata } from './types';
export declare class Logger {
    private readonly globalConfig;
    private readonly instanceSettings;
    private internalLogger;
    private readonly level;
    private readonly scopes;
    private get isScopingEnabled();
    constructor(globalConfig: GlobalConfig, instanceSettings: InstanceSettings, { isRoot }?: {
        isRoot?: boolean;
    });
    private setInternalLogger;
    scoped(scopes: LogScope | LogScope[]): Logger;
    private log;
    private setLevel;
    private setConsoleTransport;
    private scopeFilter;
    private debugDevConsoleFormat;
    private debugProdConsoleFormat;
    private devTsFormat;
    private toPrintable;
    private setFileTransport;
    error(message: string, metadata?: LogMetadata): void;
    warn(message: string, metadata?: LogMetadata): void;
    info(message: string, metadata?: LogMetadata): void;
    debug(message: string, metadata?: LogMetadata): void;
    getInternalLogger(): winston.Logger;
}
