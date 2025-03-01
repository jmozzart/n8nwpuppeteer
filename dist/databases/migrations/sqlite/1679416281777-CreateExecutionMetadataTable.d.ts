import type { MigrationContext, ReversibleMigration } from '../../../databases/types';
export declare class CreateExecutionMetadataTable1679416281777 implements ReversibleMigration {
    up({ queryRunner, tablePrefix }: MigrationContext): Promise<void>;
    down({ queryRunner, tablePrefix }: MigrationContext): Promise<void>;
}
