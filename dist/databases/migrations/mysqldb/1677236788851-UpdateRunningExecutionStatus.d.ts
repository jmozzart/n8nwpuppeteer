import type { MigrationContext, IrreversibleMigration } from '../../../databases/types';
export declare class UpdateRunningExecutionStatus1677236788851 implements IrreversibleMigration {
    up({ queryRunner, tablePrefix }: MigrationContext): Promise<void>;
}
