import { GlobalConfig } from '@n8n/config';
import { type IDataObject, type Workflow } from 'n8n-workflow';
import { WorkflowRepository } from '../databases/repositories/workflow.repository';
import { Logger } from '../logging/logger.service';
export declare class WorkflowStaticDataService {
    private readonly globalConfig;
    private readonly logger;
    private readonly workflowRepository;
    constructor(globalConfig: GlobalConfig, logger: Logger, workflowRepository: WorkflowRepository);
    getStaticDataById(workflowId: string): Promise<IDataObject>;
    saveStaticData(workflow: Workflow): Promise<void>;
    saveStaticDataById(workflowId: string, newStaticData: IDataObject): Promise<void>;
}
