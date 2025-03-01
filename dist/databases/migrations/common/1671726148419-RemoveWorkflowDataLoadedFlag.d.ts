import type { MigrationContext, ReversibleMigration } from '../../../databases/types';
export declare class RemoveWorkflowDataLoadedFlag1671726148419 implements ReversibleMigration {
    up({ escape, dbType, runQuery }: MigrationContext): Promise<void>;
    down({ escape, runQuery }: MigrationContext): Promise<void>;
}
