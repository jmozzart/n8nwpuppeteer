import { Response, NextFunction } from 'express';
import { SharedWorkflowRepository } from '../databases/repositories/shared-workflow.repository';
import { WorkflowStatisticsRepository } from '../databases/repositories/workflow-statistics.repository';
import type { IWorkflowStatisticsDataLoaded } from '../interfaces';
import { Logger } from '../logging/logger.service';
import { StatisticsRequest } from './workflow-statistics.types';
interface WorkflowStatisticsData<T> {
    productionSuccess: T;
    productionError: T;
    manualSuccess: T;
    manualError: T;
}
export declare class WorkflowStatisticsController {
    private readonly sharedWorkflowRepository;
    private readonly workflowStatisticsRepository;
    private readonly logger;
    constructor(sharedWorkflowRepository: SharedWorkflowRepository, workflowStatisticsRepository: WorkflowStatisticsRepository, logger: Logger);
    hasWorkflowAccess(req: StatisticsRequest.GetOne, _res: Response, next: NextFunction): Promise<void>;
    getCounts(req: StatisticsRequest.GetOne): Promise<WorkflowStatisticsData<number>>;
    getTimes(req: StatisticsRequest.GetOne): Promise<WorkflowStatisticsData<Date | null>>;
    getDataLoaded(req: StatisticsRequest.GetOne): Promise<IWorkflowStatisticsDataLoaded>;
    private getData;
}
export {};
