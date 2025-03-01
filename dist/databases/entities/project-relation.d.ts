import { WithTimestamps } from './abstract-entity';
import { Project } from './project';
import { User } from './user';
export type ProjectRole = 'project:personalOwner' | 'project:admin' | 'project:editor' | 'project:viewer';
export declare class ProjectRelation extends WithTimestamps {
    role: ProjectRole;
    user: User;
    userId: string;
    project: Project;
    projectId: string;
}
