import { ApplicationError } from 'n8n-workflow';
export declare class MaxStalledCountError extends ApplicationError {
    constructor(cause: Error);
}
