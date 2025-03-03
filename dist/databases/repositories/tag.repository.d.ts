import type { EntityManager } from '@n8n/typeorm';
import { DataSource, Repository } from '@n8n/typeorm';
import { TagEntity } from '../entities/tag-entity';
import type { WorkflowEntity } from '../entities/workflow-entity';
export declare class TagRepository extends Repository<TagEntity> {
    constructor(dataSource: DataSource);
    findMany(tagIds: string[]): Promise<TagEntity[]>;
    setTags(tx: EntityManager, dbTags: TagEntity[], workflow: WorkflowEntity): Promise<void>;
    getWorkflowIdsViaTags(tags: string[]): Promise<string[]>;
}
