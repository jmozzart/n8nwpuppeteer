"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskRunnerModule = void 0;
const config_1 = require("@n8n/config");
const a = __importStar(require("node:assert/strict"));
const typedi_1 = __importStar(require("typedi"));
const on_shutdown_1 = require("../decorators/on-shutdown");
const missing_auth_token_error_1 = require("./errors/missing-auth-token.error");
const runner_ws_server_1 = require("./runner-ws-server");
let TaskRunnerModule = class TaskRunnerModule {
    constructor(runnerConfig) {
        this.runnerConfig = runnerConfig;
    }
    async start() {
        a.ok(this.runnerConfig.enabled, 'Task runner is disabled');
        const { mode, authToken } = this.runnerConfig;
        if (mode === 'external' && !authToken)
            throw new missing_auth_token_error_1.MissingAuthTokenError();
        await this.loadTaskManager();
        await this.loadTaskRunnerServer();
        if (mode === 'internal') {
            await this.startInternalTaskRunner();
        }
    }
    async stop() {
        const stopRunnerProcessTask = (async () => {
            if (this.taskRunnerProcess) {
                await this.taskRunnerProcess.stop();
                this.taskRunnerProcess = undefined;
            }
        })();
        const stopRunnerServerTask = (async () => {
            if (this.taskRunnerHttpServer) {
                await this.taskRunnerHttpServer.stop();
                this.taskRunnerHttpServer = undefined;
            }
        })();
        await Promise.all([stopRunnerProcessTask, stopRunnerServerTask]);
    }
    async loadTaskManager() {
        const { TaskManager } = await Promise.resolve().then(() => __importStar(require('../runners/task-managers/task-manager')));
        const { LocalTaskManager } = await Promise.resolve().then(() => __importStar(require('../runners/task-managers/local-task-manager')));
        this.taskManager = typedi_1.default.get(LocalTaskManager);
        typedi_1.default.set(TaskManager, this.taskManager);
    }
    async loadTaskRunnerServer() {
        const { TaskRunnerServer } = await Promise.resolve().then(() => __importStar(require('../runners/task-runner-server')));
        this.taskRunnerHttpServer = typedi_1.default.get(TaskRunnerServer);
        this.taskRunnerWsServer = typedi_1.default.get(runner_ws_server_1.TaskRunnerWsServer);
        await this.taskRunnerHttpServer.start();
    }
    async startInternalTaskRunner() {
        a.ok(this.taskRunnerWsServer, 'Task Runner WS Server not loaded');
        const { TaskRunnerProcess } = await Promise.resolve().then(() => __importStar(require('../runners/task-runner-process')));
        this.taskRunnerProcess = typedi_1.default.get(TaskRunnerProcess);
        await this.taskRunnerProcess.start();
        const { InternalTaskRunnerDisconnectAnalyzer } = await Promise.resolve().then(() => __importStar(require('../runners/internal-task-runner-disconnect-analyzer')));
        this.taskRunnerWsServer.setDisconnectAnalyzer(typedi_1.default.get(InternalTaskRunnerDisconnectAnalyzer));
    }
};
exports.TaskRunnerModule = TaskRunnerModule;
__decorate([
    (0, on_shutdown_1.OnShutdown)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TaskRunnerModule.prototype, "stop", null);
exports.TaskRunnerModule = TaskRunnerModule = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [config_1.TaskRunnersConfig])
], TaskRunnerModule);
//# sourceMappingURL=task-runner-module.js.map