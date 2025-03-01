import type { MigrationContext, ReversibleMigration } from '../../../databases/types';
export declare class CreateCredentialUsageTable1665484192213 implements ReversibleMigration {
    up({ queryRunner, tablePrefix }: MigrationContext): Promise<void>;
    down({ queryRunner, tablePrefix }: MigrationContext): Promise<void>;
}
