import type { MigrationContext, IrreversibleMigration } from '../../../databases/types';
export declare class LowerCaseUserEmail1648740597343 implements IrreversibleMigration {
    up({ queryRunner, tablePrefix }: MigrationContext): Promise<void>;
}
