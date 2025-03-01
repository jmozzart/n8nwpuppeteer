"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.messageEventBusDestinationFromDb = messageEventBusDestinationFromDb;
const typedi_1 = require("typedi");
const logger_service_1 = require("../../logging/logger.service");
const message_event_bus_destination_sentry_ee_1 = require("./message-event-bus-destination-sentry.ee");
const message_event_bus_destination_syslog_ee_1 = require("./message-event-bus-destination-syslog.ee");
const message_event_bus_destination_webhook_ee_1 = require("./message-event-bus-destination-webhook.ee");
function messageEventBusDestinationFromDb(eventBusInstance, dbData) {
    const destinationData = dbData.destination;
    if ('__type' in destinationData) {
        switch (destinationData.__type) {
            case "$$MessageEventBusDestinationSentry":
                return message_event_bus_destination_sentry_ee_1.MessageEventBusDestinationSentry.deserialize(eventBusInstance, destinationData);
            case "$$MessageEventBusDestinationSyslog":
                return message_event_bus_destination_syslog_ee_1.MessageEventBusDestinationSyslog.deserialize(eventBusInstance, destinationData);
            case "$$MessageEventBusDestinationWebhook":
                return message_event_bus_destination_webhook_ee_1.MessageEventBusDestinationWebhook.deserialize(eventBusInstance, destinationData);
            default:
                typedi_1.Container.get(logger_service_1.Logger).debug('MessageEventBusDestination __type unknown');
        }
    }
    return null;
}
//# sourceMappingURL=message-event-bus-destination-from-db.js.map