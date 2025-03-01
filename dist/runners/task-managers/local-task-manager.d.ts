import type { RequesterMessage } from '@n8n/task-runner';
import { NodeTypes } from '../../node-types';
import { TaskManager } from './task-manager';
import { TaskBroker } from '../task-broker.service';
export declare class LocalTaskManager extends TaskManager {
    taskBroker: TaskBroker;
    id: string;
    constructor(nodeTypes: NodeTypes);
    registerRequester(): void;
    sendMessage(message: RequesterMessage.ToBroker.All): void;
}
