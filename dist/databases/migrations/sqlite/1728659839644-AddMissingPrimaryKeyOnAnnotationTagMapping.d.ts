import type { IrreversibleMigration, MigrationContext } from '../../../databases/types';
export declare class AddMissingPrimaryKeyOnAnnotationTagMapping1728659839644 implements IrreversibleMigration {
    up({ queryRunner, tablePrefix, schemaBuilder: { createTable, column, dropIndex }, }: MigrationContext): Promise<void>;
}
