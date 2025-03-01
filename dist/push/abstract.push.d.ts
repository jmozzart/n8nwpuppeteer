import type { PushPayload, PushType } from '@n8n/api-types';
import type { User } from '../databases/entities/user';
import { Logger } from '../logging/logger.service';
import type { OnPushMessage } from '../push/types';
import { TypedEmitter } from '../typed-emitter';
export interface AbstractPushEvents {
    message: OnPushMessage;
}
export declare abstract class AbstractPush<Connection> extends TypedEmitter<AbstractPushEvents> {
    protected readonly logger: Logger;
    protected connections: Record<string, Connection>;
    protected userIdByPushRef: Record<string, string>;
    protected abstract close(connection: Connection): void;
    protected abstract sendToOneConnection(connection: Connection, data: string): void;
    protected abstract ping(connection: Connection): void;
    constructor(logger: Logger);
    protected add(pushRef: string, userId: User['id'], connection: Connection): void;
    protected onMessageReceived(pushRef: string, msg: unknown): void;
    protected remove(pushRef?: string): void;
    private sendTo;
    private pingAll;
    sendToAll<Type extends PushType>(type: Type, data: PushPayload<Type>): void;
    sendToOne<Type extends PushType>(type: Type, data: PushPayload<Type>, pushRef: string): void;
    sendToUsers<Type extends PushType>(type: Type, data: PushPayload<Type>, userIds: Array<User['id']>): void;
    closeAllConnections(): void;
    hasPushRef(pushRef: string): boolean;
}
