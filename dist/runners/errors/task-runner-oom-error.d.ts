import { ApplicationError } from 'n8n-workflow';
import type { TaskRunner } from '../task-broker.service';
export declare class TaskRunnerOomError extends ApplicationError {
    readonly runnerId: TaskRunner['id'];
    description: string;
    constructor(runnerId: TaskRunner['id'], isCloudDeployment: boolean);
}
