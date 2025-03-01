import type { MigrationContext, ReversibleMigration } from '../../../databases/types';
export declare class InitialMigration1587669153312 implements ReversibleMigration {
    up({ queryRunner, tablePrefix }: MigrationContext): Promise<void>;
    down({ queryRunner, tablePrefix }: MigrationContext): Promise<void>;
}
