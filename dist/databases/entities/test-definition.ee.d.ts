import { AnnotationTagEntity } from '../../databases/entities/annotation-tag-entity.ee';
import { WorkflowEntity } from '../../databases/entities/workflow-entity';
import { WithTimestampsAndStringId } from './abstract-entity';
export declare class TestDefinition extends WithTimestampsAndStringId {
    name: string;
    description: string;
    workflow: WorkflowEntity;
    workflowId: string;
    evaluationWorkflow: WorkflowEntity;
    evaluationWorkflowId: string;
    annotationTag: AnnotationTagEntity;
    annotationTagId: string;
}
