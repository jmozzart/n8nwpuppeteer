import type WebSocket from 'ws';
import type { User } from '../databases/entities/user';
import { AbstractPush } from './abstract.push';
export declare class WebSocketPush extends AbstractPush<WebSocket> {
    add(pushRef: string, userId: User['id'], connection: WebSocket): void;
    protected close(connection: WebSocket): void;
    protected sendToOneConnection(connection: WebSocket, data: string): void;
    protected ping(connection: WebSocket): void;
}
