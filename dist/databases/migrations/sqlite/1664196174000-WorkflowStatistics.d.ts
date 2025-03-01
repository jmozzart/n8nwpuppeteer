import type { MigrationContext, ReversibleMigration } from '../../../databases/types';
export declare class WorkflowStatistics1664196174000 implements ReversibleMigration {
    up({ queryRunner, tablePrefix }: MigrationContext): Promise<void>;
    down({ queryRunner, tablePrefix }: MigrationContext): Promise<void>;
}
