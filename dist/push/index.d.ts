import type { PushPayload, PushType } from '@n8n/api-types';
import type { Application } from 'express';
import type { Server } from 'http';
import type { User } from '../databases/entities/user';
import { Publisher } from '../scaling/pubsub/publisher.service';
import { OrchestrationService } from '../services/orchestration.service';
import { TypedEmitter } from '../typed-emitter';
import { SSEPush } from './sse.push';
import type { OnPushMessage, PushResponse, SSEPushRequest, WebSocketPushRequest } from './types';
import { WebSocketPush } from './websocket.push';
type PushEvents = {
    editorUiConnected: string;
    message: OnPushMessage;
};
export declare class Push extends TypedEmitter<PushEvents> {
    private readonly orchestrationService;
    private readonly publisher;
    isBidirectional: boolean;
    private backend;
    constructor(orchestrationService: OrchestrationService, publisher: Publisher);
    getBackend(): SSEPush | WebSocketPush;
    handleRequest(req: SSEPushRequest | WebSocketPushRequest, res: PushResponse): void;
    broadcast<Type extends PushType>(type: Type, data: PushPayload<Type>): void;
    send<Type extends PushType>(type: Type, data: PushPayload<Type>, pushRef: string): void;
    sendToUsers<Type extends PushType>(type: Type, data: PushPayload<Type>, userIds: Array<User['id']>): void;
    onShutdown(): void;
}
export declare const setupPushServer: (restEndpoint: string, server: Server, app: Application) => void;
export declare const setupPushHandler: (restEndpoint: string, app: Application) => void;
export {};
