import type { MigrationContext, ReversibleMigration } from '../../../databases/types';
export declare class AddNodeIds1658930531669 implements ReversibleMigration {
    up({ escape, runQuery, runInBatches, parseJson }: MigrationContext): Promise<void>;
    down({ escape, runQuery, runInBatches, parseJson }: MigrationContext): Promise<void>;
}
