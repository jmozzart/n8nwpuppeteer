import type { ICredentialsDb } from '../../interfaces';
import { WithTimestampsAndStringId } from './abstract-entity';
import type { SharedCredentials } from './shared-credentials';
export declare class CredentialsEntity extends WithTimestampsAndStringId implements ICredentialsDb {
    name: string;
    data: string;
    type: string;
    shared: SharedCredentials[];
    toJSON(): Omit<this, "generateId" | "setUpdateDate" | "shared" | "toJSON">;
}
