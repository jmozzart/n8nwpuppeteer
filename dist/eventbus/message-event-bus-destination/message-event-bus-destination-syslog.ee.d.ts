import type { MessageEventBusDestinationOptions, MessageEventBusDestinationSyslogOptions } from 'n8n-workflow';
import syslog from 'syslog-client';
import { MessageEventBusDestination } from './message-event-bus-destination.ee';
import type { MessageEventBus, MessageWithCallback } from '../message-event-bus/message-event-bus';
export declare const isMessageEventBusDestinationSyslogOptions: (candidate: unknown) => candidate is MessageEventBusDestinationSyslogOptions;
export declare class MessageEventBusDestinationSyslog extends MessageEventBusDestination implements MessageEventBusDestinationSyslogOptions {
    client: syslog.Client;
    expectedStatusCode?: number;
    host: string;
    port: number;
    protocol: 'udp' | 'tcp';
    facility: syslog.Facility;
    app_name: string;
    eol: string;
    constructor(eventBusInstance: MessageEventBus, options: MessageEventBusDestinationSyslogOptions);
    receiveFromEventBus(emitterPayload: MessageWithCallback): Promise<boolean>;
    serialize(): MessageEventBusDestinationSyslogOptions;
    static deserialize(eventBusInstance: MessageEventBus, data: MessageEventBusDestinationOptions): MessageEventBusDestinationSyslog | null;
    toString(): string;
    close(): Promise<void>;
}
