import { GlobalConfig } from '@n8n/config';
import { InstanceSettings } from 'n8n-core';
import { Logger } from '../logging/logger.service';
import { Publisher } from '../scaling/pubsub/publisher.service';
import { RedisClientService } from '../services/redis-client.service';
import { TypedEmitter } from '../typed-emitter';
type MultiMainEvents = {
    'leader-stepdown': never;
    'leader-takeover': never;
};
export declare class MultiMainSetup extends TypedEmitter<MultiMainEvents> {
    private readonly logger;
    private readonly instanceSettings;
    private readonly publisher;
    private readonly redisClientService;
    private readonly globalConfig;
    constructor(logger: Logger, instanceSettings: InstanceSettings, publisher: Publisher, redisClientService: RedisClientService, globalConfig: GlobalConfig);
    private leaderKey;
    private readonly leaderKeyTtl;
    private leaderCheckInterval;
    init(): Promise<void>;
    shutdown(): Promise<void>;
    private checkLeader;
    private tryBecomeLeader;
    fetchLeaderKey(): Promise<string | null>;
}
export {};
