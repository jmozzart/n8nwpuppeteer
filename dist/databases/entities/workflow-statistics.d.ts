import { WorkflowEntity } from './workflow-entity';
export declare const enum StatisticsNames {
    productionSuccess = "production_success",
    productionError = "production_error",
    manualSuccess = "manual_success",
    manualError = "manual_error",
    dataLoaded = "data_loaded"
}
export declare class WorkflowStatistics {
    count: number;
    latestEvent: Date;
    name: StatisticsNames;
    workflow: WorkflowEntity;
    workflowId: string;
}
