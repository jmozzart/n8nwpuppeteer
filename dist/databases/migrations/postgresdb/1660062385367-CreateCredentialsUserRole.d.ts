import type { MigrationContext, ReversibleMigration } from '../../../databases/types';
export declare class CreateCredentialsUserRole1660062385367 implements ReversibleMigration {
    up({ queryRunner, tablePrefix }: MigrationContext): Promise<void>;
    down({ queryRunner, tablePrefix }: MigrationContext): Promise<void>;
}
