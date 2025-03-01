import { DataSource, Repository } from '@n8n/typeorm';
import { ProjectRelation, type ProjectRole } from '../entities/project-relation';
export declare class ProjectRelationRepository extends Repository<ProjectRelation> {
    constructor(dataSource: DataSource);
    getPersonalProjectOwners(projectIds: string[]): Promise<ProjectRelation[]>;
    getPersonalProjectsForUsers(userIds: string[]): Promise<string[]>;
    findProjectRole({ userId, projectId }: {
        userId: string;
        projectId: string;
    }): Promise<ProjectRole | null>;
    countUsersByRole(): Promise<Record<ProjectRole, number>>;
    findUserIdsByProjectId(projectId: string): Promise<string[]>;
    findAllByUser(userId: string): Promise<ProjectRelation[]>;
}
