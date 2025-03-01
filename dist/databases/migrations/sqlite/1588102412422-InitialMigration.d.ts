import type { MigrationContext, ReversibleMigration } from '../../../databases/types';
export declare class InitialMigration1588102412422 implements ReversibleMigration {
    up({ queryRunner, tablePrefix }: MigrationContext): Promise<void>;
    down({ queryRunner, tablePrefix }: MigrationContext): Promise<void>;
}
