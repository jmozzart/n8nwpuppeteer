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
exports.LocalTaskManager = void 0;
const typedi_1 = __importStar(require("typedi"));
const node_types_1 = require("../../node-types");
const task_manager_1 = require("./task-manager");
const task_broker_service_1 = require("../task-broker.service");
let LocalTaskManager = class LocalTaskManager extends task_manager_1.TaskManager {
    constructor(nodeTypes) {
        super(nodeTypes);
        this.id = 'single-main';
        this.registerRequester();
    }
    registerRequester() {
        this.taskBroker = typedi_1.default.get(task_broker_service_1.TaskBroker);
        this.taskBroker.registerRequester(this.id, this.onMessage.bind(this));
    }
    sendMessage(message) {
        void this.taskBroker.onRequesterMessage(this.id, message);
    }
};
exports.LocalTaskManager = LocalTaskManager;
exports.LocalTaskManager = LocalTaskManager = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [node_types_1.NodeTypes])
], LocalTaskManager);
//# sourceMappingURL=local-task-manager.js.map