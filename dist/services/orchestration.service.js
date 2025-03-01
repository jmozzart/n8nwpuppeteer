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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrchestrationService = void 0;
const config_1 = require("@n8n/config");
const n8n_core_1 = require("n8n-core");
const typedi_1 = __importStar(require("typedi"));
const config_2 = __importDefault(require("../config"));
const multi_main_setup_ee_1 = require("../scaling/multi-main-setup.ee");
let OrchestrationService = class OrchestrationService {
    constructor(instanceSettings, multiMainSetup, globalConfig) {
        this.instanceSettings = instanceSettings;
        this.multiMainSetup = multiMainSetup;
        this.globalConfig = globalConfig;
        this.isInitialized = false;
        this.isMultiMainSetupLicensed = false;
    }
    setMultiMainSetupLicensed(newState) {
        this.isMultiMainSetupLicensed = newState;
    }
    get isMultiMainSetupEnabled() {
        return (config_2.default.getEnv('executions.mode') === 'queue' &&
            this.globalConfig.multiMainSetup.enabled &&
            this.instanceSettings.instanceType === 'main' &&
            this.isMultiMainSetupLicensed);
    }
    get isSingleMainSetup() {
        return !this.isMultiMainSetupEnabled;
    }
    sanityCheck() {
        return this.isInitialized && config_2.default.get('executions.mode') === 'queue';
    }
    async init() {
        if (this.isInitialized)
            return;
        if (config_2.default.get('executions.mode') === 'queue') {
            const { Publisher } = await Promise.resolve().then(() => __importStar(require('../scaling/pubsub/publisher.service')));
            this.publisher = typedi_1.default.get(Publisher);
            const { Subscriber } = await Promise.resolve().then(() => __importStar(require('../scaling/pubsub/subscriber.service')));
            this.subscriber = typedi_1.default.get(Subscriber);
        }
        if (this.isMultiMainSetupEnabled) {
            await this.multiMainSetup.init();
        }
        else {
            this.instanceSettings.markAsLeader();
        }
        this.isInitialized = true;
    }
    async shutdown() {
        if (!this.isInitialized)
            return;
        if (this.isMultiMainSetupEnabled)
            await this.multiMainSetup.shutdown();
        this.publisher.shutdown();
        this.subscriber.shutdown();
        this.isInitialized = false;
    }
};
exports.OrchestrationService = OrchestrationService;
exports.OrchestrationService = OrchestrationService = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [n8n_core_1.InstanceSettings,
        multi_main_setup_ee_1.MultiMainSetup,
        config_1.GlobalConfig])
], OrchestrationService);
//# sourceMappingURL=orchestration.service.js.map