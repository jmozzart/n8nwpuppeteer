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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExternalSecretsService = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const typedi_1 = __importStar(require("typedi"));
const constants_1 = require("../constants");
const external_secrets_provider_not_found_error_1 = require("../errors/external-secrets-provider-not-found.error");
const external_secrets_manager_ee_1 = require("./external-secrets-manager.ee");
let ExternalSecretsService = class ExternalSecretsService {
    getProvider(providerName) {
        const providerAndSettings = typedi_1.default.get(external_secrets_manager_ee_1.ExternalSecretsManager).getProviderWithSettings(providerName);
        if (!providerAndSettings) {
            throw new external_secrets_provider_not_found_error_1.ExternalSecretsProviderNotFoundError(providerName);
        }
        const { provider, settings } = providerAndSettings;
        return {
            displayName: provider.displayName,
            name: provider.name,
            icon: provider.name,
            state: provider.state,
            connected: settings.connected,
            connectedAt: settings.connectedAt,
            properties: provider.properties,
            data: this.redact(settings.settings, provider),
        };
    }
    async getProviders() {
        return typedi_1.default.get(external_secrets_manager_ee_1.ExternalSecretsManager)
            .getProvidersWithSettings()
            .map(({ provider, settings }) => ({
            displayName: provider.displayName,
            name: provider.name,
            icon: provider.name,
            state: provider.state,
            connected: !!settings.connected,
            connectedAt: settings.connectedAt,
            data: this.redact(settings.settings, provider),
        }));
    }
    redact(data, provider) {
        const copiedData = (0, n8n_workflow_1.deepCopy)(data || {});
        const properties = provider.properties;
        for (const dataKey of Object.keys(copiedData)) {
            if (dataKey === 'oauthTokenData') {
                copiedData[dataKey] = constants_1.CREDENTIAL_BLANKING_VALUE;
                continue;
            }
            const prop = properties.find((v) => v.name === dataKey);
            if (!prop) {
                continue;
            }
            if (prop.typeOptions?.password &&
                (!copiedData[dataKey].startsWith('=') || prop.noDataExpression)) {
                copiedData[dataKey] = constants_1.CREDENTIAL_BLANKING_VALUE;
            }
        }
        return copiedData;
    }
    unredactRestoreValues(unmerged, replacement) {
        for (const [key, value] of Object.entries(unmerged)) {
            if (value === constants_1.CREDENTIAL_BLANKING_VALUE) {
                unmerged[key] = replacement[key];
            }
            else if (typeof value === 'object' &&
                value !== null &&
                key in replacement &&
                typeof replacement[key] === 'object' &&
                replacement[key] !== null) {
                this.unredactRestoreValues(value, replacement[key]);
            }
        }
    }
    unredact(redactedData, savedData) {
        const mergedData = (0, n8n_workflow_1.deepCopy)(redactedData ?? {});
        this.unredactRestoreValues(mergedData, savedData);
        return mergedData;
    }
    async saveProviderSettings(providerName, data, userId) {
        const providerAndSettings = typedi_1.default.get(external_secrets_manager_ee_1.ExternalSecretsManager).getProviderWithSettings(providerName);
        if (!providerAndSettings) {
            throw new external_secrets_provider_not_found_error_1.ExternalSecretsProviderNotFoundError(providerName);
        }
        const { settings } = providerAndSettings;
        const newData = this.unredact(data, settings.settings);
        await typedi_1.default.get(external_secrets_manager_ee_1.ExternalSecretsManager).setProviderSettings(providerName, newData, userId);
    }
    async saveProviderConnected(providerName, connected) {
        const providerAndSettings = typedi_1.default.get(external_secrets_manager_ee_1.ExternalSecretsManager).getProviderWithSettings(providerName);
        if (!providerAndSettings) {
            throw new external_secrets_provider_not_found_error_1.ExternalSecretsProviderNotFoundError(providerName);
        }
        await typedi_1.default.get(external_secrets_manager_ee_1.ExternalSecretsManager).setProviderConnected(providerName, connected);
        return this.getProvider(providerName);
    }
    getAllSecrets() {
        return typedi_1.default.get(external_secrets_manager_ee_1.ExternalSecretsManager).getAllSecretNames();
    }
    async testProviderSettings(providerName, data) {
        const providerAndSettings = typedi_1.default.get(external_secrets_manager_ee_1.ExternalSecretsManager).getProviderWithSettings(providerName);
        if (!providerAndSettings) {
            throw new external_secrets_provider_not_found_error_1.ExternalSecretsProviderNotFoundError(providerName);
        }
        const { settings } = providerAndSettings;
        const newData = this.unredact(data, settings.settings);
        return await typedi_1.default.get(external_secrets_manager_ee_1.ExternalSecretsManager).testProviderSettings(providerName, newData);
    }
    async updateProvider(providerName) {
        const providerAndSettings = typedi_1.default.get(external_secrets_manager_ee_1.ExternalSecretsManager).getProviderWithSettings(providerName);
        if (!providerAndSettings) {
            throw new external_secrets_provider_not_found_error_1.ExternalSecretsProviderNotFoundError(providerName);
        }
        return await typedi_1.default.get(external_secrets_manager_ee_1.ExternalSecretsManager).updateProvider(providerName);
    }
};
exports.ExternalSecretsService = ExternalSecretsService;
exports.ExternalSecretsService = ExternalSecretsService = __decorate([
    (0, typedi_1.Service)()
], ExternalSecretsService);
//# sourceMappingURL=external-secrets.service.ee.js.map