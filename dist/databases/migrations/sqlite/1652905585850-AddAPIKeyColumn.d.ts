import type { MigrationContext, ReversibleMigration } from '../../../databases/types';
export declare class AddAPIKeyColumn1652905585850 implements ReversibleMigration {
    transaction: false;
    up({ queryRunner, tablePrefix }: MigrationContext): Promise<void>;
    down({ queryRunner, tablePrefix }: MigrationContext): Promise<void>;
}
