import type { MigrationContext, ReversibleMigration } from '../../../databases/types';
export declare class RemoveCredentialUsageTable1665754637025 implements ReversibleMigration {
    up({ queryRunner, tablePrefix }: MigrationContext): Promise<void>;
    down({ queryRunner, tablePrefix }: MigrationContext): Promise<void>;
}
