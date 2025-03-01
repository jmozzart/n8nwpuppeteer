import { ApplicationError } from 'n8n-workflow';
export declare class TaskRejectError extends ApplicationError {
    reason: string;
    constructor(reason: string);
}
export declare class TaskDeferredError extends ApplicationError {
    constructor();
}
export declare class TaskError extends ApplicationError {
}
