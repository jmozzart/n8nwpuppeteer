import type { MigrationContext, ReversibleMigration } from '../../../databases/types';
export declare class RemoveCredentialUsageTable1665754637026 implements ReversibleMigration {
    up({ queryRunner, tablePrefix }: MigrationContext): Promise<void>;
    down({ queryRunner, tablePrefix }: MigrationContext): Promise<void>;
}
