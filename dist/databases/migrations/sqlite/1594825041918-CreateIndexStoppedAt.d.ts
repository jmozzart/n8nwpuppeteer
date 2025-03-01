import type { MigrationContext, ReversibleMigration } from '../../../databases/types';
export declare class CreateIndexStoppedAt1594825041918 implements ReversibleMigration {
    up({ queryRunner, tablePrefix }: MigrationContext): Promise<void>;
    down({ queryRunner, tablePrefix }: MigrationContext): Promise<void>;
}
