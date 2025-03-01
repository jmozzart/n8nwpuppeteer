import { WithTimestampsAndStringId } from './abstract-entity';
import type { WorkflowEntity } from './workflow-entity';
import type { WorkflowTagMapping } from './workflow-tag-mapping';
export declare class TagEntity extends WithTimestampsAndStringId {
    name: string;
    workflows: WorkflowEntity[];
    workflowMappings: WorkflowTagMapping[];
}
