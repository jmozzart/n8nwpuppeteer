import type { MigrationContext, ReversibleMigration } from '../../../databases/types';
export declare class CreateVariables1677501636752 implements ReversibleMigration {
    up({ queryRunner, tablePrefix }: MigrationContext): Promise<void>;
    down({ queryRunner, tablePrefix }: MigrationContext): Promise<void>;
}
