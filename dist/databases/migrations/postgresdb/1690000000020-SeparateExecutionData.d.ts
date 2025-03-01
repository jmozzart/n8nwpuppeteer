import type { MigrationContext, ReversibleMigration } from '../../../databases/types';
export declare class SeparateExecutionData1690000000020 implements ReversibleMigration {
    up({ queryRunner, tablePrefix }: MigrationContext): Promise<void>;
    down({ queryRunner, tablePrefix }: MigrationContext): Promise<void>;
}
