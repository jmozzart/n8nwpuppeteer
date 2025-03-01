import type { Class } from 'n8n-core';
import { ApplicationError } from 'n8n-workflow';
import { Logger } from '../logging/logger.service';
type HandlerFn = () => Promise<void> | void;
export type ServiceClass = Class<Record<string, HandlerFn>>;
export interface ShutdownHandler {
    serviceClass: ServiceClass;
    methodName: string;
}
export declare class ComponentShutdownError extends ApplicationError {
    constructor(componentName: string, cause: Error);
}
export declare class ShutdownService {
    private readonly logger;
    private readonly handlersByPriority;
    private shutdownPromise;
    constructor(logger: Logger);
    register(priority: number, handler: ShutdownHandler): void;
    validate(): void;
    shutdown(): void;
    waitForShutdown(): Promise<void>;
    isShuttingDown(): boolean;
    private startShutdown;
    private shutdownComponent;
}
export {};
