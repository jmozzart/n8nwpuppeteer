import type { EntitySubscriberInterface, UpdateEvent } from '@n8n/typeorm';
import { User } from '../entities/user';
export declare class UserSubscriber implements EntitySubscriberInterface<User> {
    listenTo(): typeof User;
    afterUpdate(event: UpdateEvent<User>): Promise<void>;
}
