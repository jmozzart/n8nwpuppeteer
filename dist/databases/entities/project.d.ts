import { WithTimestampsAndStringId } from './abstract-entity';
import type { ProjectRelation } from './project-relation';
import type { SharedCredentials } from './shared-credentials';
import type { SharedWorkflow } from './shared-workflow';
export type ProjectType = 'personal' | 'team';
export declare class Project extends WithTimestampsAndStringId {
    name: string;
    type: ProjectType;
    projectRelations: ProjectRelation[];
    sharedCredentials: SharedCredentials[];
    sharedWorkflows: SharedWorkflow[];
}
