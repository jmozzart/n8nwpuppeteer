"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageEventBusDestination = void 0;
const typedi_1 = require("typedi");
const uuid_1 = require("uuid");
const event_destinations_repository_1 = require("../../databases/repositories/event-destinations.repository");
const license_1 = require("../../license");
const logger_service_1 = require("../../logging/logger.service");
class MessageEventBusDestination {
    constructor(eventBusInstance, options) {
        this.credentials = {};
        this.logger = typedi_1.Container.get(logger_service_1.Logger);
        this.license = typedi_1.Container.get(license_1.License);
        this.eventBusInstance = eventBusInstance;
        this.id = !options.id || options.id.length !== 36 ? (0, uuid_1.v4)() : options.id;
        this.__type = options.__type ?? "$$AbstractMessageEventBusDestination";
        this.label = options.label ?? 'Log Destination';
        this.enabled = options.enabled ?? false;
        this.subscribedEvents = options.subscribedEvents ?? [];
        this.anonymizeAuditMessages = options.anonymizeAuditMessages ?? false;
        if (options.credentials)
            this.credentials = options.credentials;
        this.logger.debug(`${this.__type}(${this.id}) event destination constructed`);
    }
    startListening() {
        if (this.enabled) {
            this.eventBusInstance.on(this.getId(), async (msg, confirmCallback) => {
                await this.receiveFromEventBus({ msg, confirmCallback });
            });
            this.logger.debug(`${this.id} listener started`);
        }
    }
    stopListening() {
        this.eventBusInstance.removeAllListeners(this.getId());
    }
    enable() {
        this.enabled = true;
        this.startListening();
    }
    disable() {
        this.enabled = false;
        this.stopListening();
    }
    getId() {
        return this.id;
    }
    hasSubscribedToEvent(msg) {
        if (!this.enabled)
            return false;
        for (const eventName of this.subscribedEvents) {
            if (eventName === '*' || msg.eventName.startsWith(eventName)) {
                return true;
            }
        }
        return false;
    }
    async saveToDb() {
        const data = {
            id: this.getId(),
            destination: this.serialize(),
        };
        const dbResult = await typedi_1.Container.get(event_destinations_repository_1.EventDestinationsRepository).upsert(data, {
            skipUpdateIfNoValuesChanged: true,
            conflictPaths: ['id'],
        });
        return dbResult;
    }
    async deleteFromDb() {
        return await MessageEventBusDestination.deleteFromDb(this.getId());
    }
    static async deleteFromDb(id) {
        const dbResult = await typedi_1.Container.get(event_destinations_repository_1.EventDestinationsRepository).delete({ id });
        return dbResult;
    }
    serialize() {
        return {
            __type: this.__type,
            id: this.getId(),
            label: this.label,
            enabled: this.enabled,
            subscribedEvents: this.subscribedEvents,
            anonymizeAuditMessages: this.anonymizeAuditMessages,
        };
    }
    toString() {
        return JSON.stringify(this.serialize());
    }
    close() {
        this.stopListening();
    }
}
exports.MessageEventBusDestination = MessageEventBusDestination;
//# sourceMappingURL=message-event-bus-destination.ee.js.map