import type { Workflow } from 'n8n-workflow';
import { ApplicationError } from 'n8n-workflow';
import type { IWorkflowDb } from '../interfaces';
export declare class WorkflowMissingIdError extends ApplicationError {
    constructor(workflow: Workflow | IWorkflowDb);
}
