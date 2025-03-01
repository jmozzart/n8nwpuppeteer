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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExternalHooks = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const typedi_1 = require("typedi");
const config_1 = __importDefault(require("./config"));
const credentials_repository_1 = require("./databases/repositories/credentials.repository");
const settings_repository_1 = require("./databases/repositories/settings.repository");
const user_repository_1 = require("./databases/repositories/user.repository");
const workflow_repository_1 = require("./databases/repositories/workflow.repository");
let ExternalHooks = class ExternalHooks {
    constructor(userRepository, settingsRepository, credentialsRepository, workflowRepository) {
        this.externalHooks = {};
        this.initDidRun = false;
        this.dbCollections = {
            User: userRepository,
            Settings: settingsRepository,
            Credentials: credentialsRepository,
            Workflow: workflowRepository,
        };
    }
    async init() {
        if (this.initDidRun) {
            return;
        }
        await this.loadHooksFiles();
        this.initDidRun = true;
    }
    async loadHooksFiles() {
        const externalHookFiles = config_1.default.getEnv('externalHookFiles').split(':');
        for (let hookFilePath of externalHookFiles) {
            hookFilePath = hookFilePath.trim();
            if (hookFilePath !== '') {
                try {
                    const hookFile = require(hookFilePath);
                    this.loadHooks(hookFile);
                }
                catch (e) {
                    const error = e instanceof Error ? e : new Error(`${e}`);
                    throw new n8n_workflow_1.ApplicationError('Problem loading external hook file', {
                        extra: { errorMessage: error.message, hookFilePath },
                        cause: error,
                    });
                }
            }
        }
    }
    loadHooks(hookFileData) {
        for (const resource of Object.keys(hookFileData)) {
            for (const operation of Object.keys(hookFileData[resource])) {
                const hookString = `${resource}.${operation}`;
                if (this.externalHooks[hookString] === undefined) {
                    this.externalHooks[hookString] = [];
                }
                this.externalHooks[hookString].push.apply(this.externalHooks[hookString], hookFileData[resource][operation]);
            }
        }
    }
    async run(hookName, hookParameters) {
        if (this.externalHooks[hookName] === undefined) {
            return;
        }
        const externalHookFunctions = {
            dbCollections: this.dbCollections,
        };
        for (const externalHookFunction of this.externalHooks[hookName]) {
            await externalHookFunction.apply(externalHookFunctions, hookParameters);
        }
    }
    exists(hookName) {
        return !!this.externalHooks[hookName];
    }
};
exports.ExternalHooks = ExternalHooks;
exports.ExternalHooks = ExternalHooks = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [user_repository_1.UserRepository,
        settings_repository_1.SettingsRepository,
        credentials_repository_1.CredentialsRepository,
        workflow_repository_1.WorkflowRepository])
], ExternalHooks);
//# sourceMappingURL=external-hooks.js.map