import type { MigrationContext, IrreversibleMigration } from '../../../databases/types';
export declare class MakeStoppedAtNullable1607431743769 implements IrreversibleMigration {
    up({ queryRunner, tablePrefix }: MigrationContext): Promise<void>;
}
