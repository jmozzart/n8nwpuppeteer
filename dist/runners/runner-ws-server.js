"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskRunnerWsServer = void 0;
const config_1 = require("@n8n/config");
const n8n_workflow_1 = require("n8n-workflow");
const typedi_1 = require("typedi");
const constants_1 = require("../constants");
const logger_service_1 = require("../logging/logger.service");
const default_task_runner_disconnect_analyzer_1 = require("./default-task-runner-disconnect-analyzer");
const runner_lifecycle_events_1 = require("./runner-lifecycle-events");
const task_broker_service_1 = require("./task-broker.service");
function heartbeat() {
    this.isAlive = true;
}
var WsStatusCode;
(function (WsStatusCode) {
    WsStatusCode[WsStatusCode["CloseNormal"] = 1000] = "CloseNormal";
    WsStatusCode[WsStatusCode["CloseGoingAway"] = 1001] = "CloseGoingAway";
    WsStatusCode[WsStatusCode["CloseProtocolError"] = 1002] = "CloseProtocolError";
    WsStatusCode[WsStatusCode["CloseUnsupportedData"] = 1003] = "CloseUnsupportedData";
    WsStatusCode[WsStatusCode["CloseNoStatus"] = 1005] = "CloseNoStatus";
    WsStatusCode[WsStatusCode["CloseAbnormal"] = 1006] = "CloseAbnormal";
    WsStatusCode[WsStatusCode["CloseInvalidData"] = 1007] = "CloseInvalidData";
})(WsStatusCode || (WsStatusCode = {}));
let TaskRunnerWsServer = class TaskRunnerWsServer {
    constructor(logger, taskBroker, disconnectAnalyzer, taskTunnersConfig, runnerLifecycleEvents) {
        this.logger = logger;
        this.taskBroker = taskBroker;
        this.disconnectAnalyzer = disconnectAnalyzer;
        this.taskTunnersConfig = taskTunnersConfig;
        this.runnerLifecycleEvents = runnerLifecycleEvents;
        this.runnerConnections = new Map();
    }
    start() {
        this.startHeartbeatChecks();
    }
    startHeartbeatChecks() {
        const { heartbeatInterval } = this.taskTunnersConfig;
        if (heartbeatInterval <= 0) {
            throw new n8n_workflow_1.ApplicationError('Heartbeat interval must be greater than 0');
        }
        this.heartbeatTimer = setInterval(() => {
            for (const [runnerId, connection] of this.runnerConnections.entries()) {
                if (!connection.isAlive) {
                    void this.removeConnection(runnerId, 'failed-heartbeat-check', 1005);
                    this.runnerLifecycleEvents.emit('runner:failed-heartbeat-check');
                    return;
                }
                connection.isAlive = false;
                connection.ping();
            }
        }, heartbeatInterval * constants_1.Time.seconds.toMilliseconds);
    }
    async stop() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = undefined;
        }
        await this.stopConnectedRunners();
    }
    setDisconnectAnalyzer(disconnectAnalyzer) {
        this.disconnectAnalyzer = disconnectAnalyzer;
    }
    getDisconnectAnalyzer() {
        return this.disconnectAnalyzer;
    }
    sendMessage(id, message) {
        this.runnerConnections.get(id)?.send(JSON.stringify(message));
    }
    add(id, connection) {
        connection.isAlive = true;
        connection.on('pong', heartbeat);
        let isConnected = false;
        const onMessage = async (data) => {
            try {
                const buffer = Array.isArray(data) ? Buffer.concat(data) : Buffer.from(data);
                const message = JSON.parse(buffer.toString('utf8'));
                if (!isConnected && message.type !== 'runner:info') {
                    return;
                }
                else if (!isConnected && message.type === 'runner:info') {
                    await this.removeConnection(id);
                    isConnected = true;
                    this.runnerConnections.set(id, connection);
                    this.taskBroker.registerRunner({
                        id,
                        taskTypes: message.types,
                        lastSeen: new Date(),
                        name: message.name,
                    }, this.sendMessage.bind(this, id));
                    this.logger.info(`Runner "${message.name}" (${id}) has been registered`);
                    return;
                }
                void this.taskBroker.onRunnerMessage(id, message);
            }
            catch (error) {
                this.logger.error(`Couldn't parse message from runner "${id}"`, {
                    error: error,
                    id,
                    data,
                });
            }
        };
        connection.once('close', async () => {
            connection.off('pong', heartbeat);
            connection.off('message', onMessage);
            await this.removeConnection(id);
        });
        connection.on('message', onMessage);
        connection.send(JSON.stringify({ type: 'broker:inforequest' }));
    }
    async removeConnection(id, reason = 'unknown', code) {
        const connection = this.runnerConnections.get(id);
        if (connection) {
            const disconnectError = await this.disconnectAnalyzer.toDisconnectError({
                runnerId: id,
                reason,
                heartbeatInterval: this.taskTunnersConfig.heartbeatInterval,
            });
            this.taskBroker.deregisterRunner(id, disconnectError);
            connection.close(code);
            this.runnerConnections.delete(id);
        }
    }
    handleRequest(req, _res) {
        this.add(req.query.id, req.ws);
    }
    async stopConnectedRunners() {
        await Promise.all(Array.from(this.runnerConnections.keys()).map(async (id) => await this.removeConnection(id, 'shutting-down', 1001)));
    }
};
exports.TaskRunnerWsServer = TaskRunnerWsServer;
exports.TaskRunnerWsServer = TaskRunnerWsServer = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [logger_service_1.Logger,
        task_broker_service_1.TaskBroker,
        default_task_runner_disconnect_analyzer_1.DefaultTaskRunnerDisconnectAnalyzer,
        config_1.TaskRunnersConfig,
        runner_lifecycle_events_1.RunnerLifecycleEvents])
], TaskRunnerWsServer);
//# sourceMappingURL=runner-ws-server.js.map