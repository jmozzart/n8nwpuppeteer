import type { MigrationContext, IrreversibleMigration } from '../../../databases/types';
export declare class UpdateRunningExecutionStatus1677236854063 implements IrreversibleMigration {
    up({ queryRunner, tablePrefix }: MigrationContext): Promise<void>;
}
