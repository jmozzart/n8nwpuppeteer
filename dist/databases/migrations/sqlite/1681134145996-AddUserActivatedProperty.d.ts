import type { MigrationContext, ReversibleMigration } from '../../../databases/types';
export declare class AddUserActivatedProperty1681134145996 implements ReversibleMigration {
    up({ queryRunner, tablePrefix }: MigrationContext): Promise<void>;
    down({ queryRunner, tablePrefix }: MigrationContext): Promise<void>;
}
