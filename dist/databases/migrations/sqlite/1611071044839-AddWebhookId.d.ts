import type { MigrationContext, ReversibleMigration } from '../../../databases/types';
export declare class AddWebhookId1611071044839 implements ReversibleMigration {
    up({ queryRunner, tablePrefix }: MigrationContext): Promise<void>;
    down({ queryRunner, tablePrefix }: MigrationContext): Promise<void>;
}
