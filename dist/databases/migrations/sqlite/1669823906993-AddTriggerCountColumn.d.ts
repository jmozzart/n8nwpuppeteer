import type { MigrationContext, ReversibleMigration } from '../../../databases/types';
export declare class AddTriggerCountColumn1669823906993 implements ReversibleMigration {
    up({ queryRunner, tablePrefix }: MigrationContext): Promise<void>;
    down({ queryRunner, tablePrefix }: MigrationContext): Promise<void>;
}
