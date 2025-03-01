import type { MigrationContext, ReversibleMigration } from '../../../databases/types';
export declare class AddStatusToExecutions1674138566000 implements ReversibleMigration {
    up({ queryRunner, tablePrefix }: MigrationContext): Promise<void>;
    down({ queryRunner, tablePrefix }: MigrationContext): Promise<void>;
}
