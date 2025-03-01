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
exports.SourceControlPreferencesService = void 0;
const class_validator_1 = require("class-validator");
const promises_1 = require("fs/promises");
const n8n_core_1 = require("n8n-core");
const n8n_workflow_1 = require("n8n-workflow");
const promises_2 = require("node:fs/promises");
const path_1 = __importDefault(require("path"));
const typedi_1 = __importStar(require("typedi"));
const config_1 = __importDefault(require("../../config"));
const settings_repository_1 = require("../../databases/repositories/settings.repository");
const logger_service_1 = require("../../logging/logger.service");
const constants_1 = require("./constants");
const source_control_helper_ee_1 = require("./source-control-helper.ee");
const source_control_preferences_1 = require("./types/source-control-preferences");
let SourceControlPreferencesService = class SourceControlPreferencesService {
    constructor(instanceSettings, logger, cipher) {
        this.instanceSettings = instanceSettings;
        this.logger = logger;
        this.cipher = cipher;
        this._sourceControlPreferences = new source_control_preferences_1.SourceControlPreferences();
        this.sshFolder = path_1.default.join(instanceSettings.n8nFolder, constants_1.SOURCE_CONTROL_SSH_FOLDER);
        this.gitFolder = path_1.default.join(instanceSettings.n8nFolder, constants_1.SOURCE_CONTROL_GIT_FOLDER);
        this.sshKeyName = path_1.default.join(this.sshFolder, constants_1.SOURCE_CONTROL_SSH_KEY_NAME);
    }
    get sourceControlPreferences() {
        return {
            ...this._sourceControlPreferences,
            connected: this._sourceControlPreferences.connected ?? false,
        };
    }
    set sourceControlPreferences(preferences) {
        this._sourceControlPreferences = source_control_preferences_1.SourceControlPreferences.merge(preferences, this._sourceControlPreferences);
    }
    isSourceControlSetup() {
        return (this.isSourceControlLicensedAndEnabled() &&
            this.getPreferences().repositoryUrl &&
            this.getPreferences().branchName);
    }
    async getKeyPairFromDatabase() {
        const dbSetting = await typedi_1.default.get(settings_repository_1.SettingsRepository).findByKey('features.sourceControl.sshKeys');
        if (!dbSetting?.value)
            return null;
        return (0, n8n_workflow_1.jsonParse)(dbSetting.value, { fallbackValue: null });
    }
    async getPrivateKeyFromDatabase() {
        const dbKeyPair = await this.getKeyPairFromDatabase();
        if (!dbKeyPair)
            throw new n8n_workflow_1.ApplicationError('Failed to find key pair in database');
        return this.cipher.decrypt(dbKeyPair.encryptedPrivateKey);
    }
    async getPublicKeyFromDatabase() {
        const dbKeyPair = await this.getKeyPairFromDatabase();
        if (!dbKeyPair)
            throw new n8n_workflow_1.ApplicationError('Failed to find key pair in database');
        return dbKeyPair.publicKey;
    }
    async getPrivateKeyPath() {
        const dbPrivateKey = await this.getPrivateKeyFromDatabase();
        const tempFilePath = path_1.default.join(this.instanceSettings.n8nFolder, 'ssh_private_key_temp');
        await (0, promises_2.writeFile)(tempFilePath, dbPrivateKey);
        await (0, promises_2.chmod)(tempFilePath, 0o600);
        return tempFilePath;
    }
    async getPublicKey() {
        try {
            const dbPublicKey = await this.getPublicKeyFromDatabase();
            if (dbPublicKey)
                return dbPublicKey;
            return await (0, promises_2.readFile)(this.sshKeyName + '.pub', { encoding: 'utf8' });
        }
        catch (e) {
            const error = e instanceof Error ? e : new Error(`${e}`);
            this.logger.error(`Failed to read SSH public key: ${error.message}`);
        }
        return '';
    }
    async deleteKeyPair() {
        try {
            await (0, promises_1.rm)(this.sshFolder, { recursive: true });
            await typedi_1.default.get(settings_repository_1.SettingsRepository).delete({ key: 'features.sourceControl.sshKeys' });
        }
        catch (e) {
            const error = e instanceof Error ? e : new Error(`${e}`);
            this.logger.error(`Failed to delete SSH key pair: ${error.message}`);
        }
    }
    async generateAndSaveKeyPair(keyPairType) {
        if (!keyPairType) {
            keyPairType =
                this.getPreferences().keyGeneratorType ??
                    config_1.default.get('sourceControl.defaultKeyPairType') ??
                    'ed25519';
        }
        const keyPair = await (0, source_control_helper_ee_1.generateSshKeyPair)(keyPairType);
        try {
            await typedi_1.default.get(settings_repository_1.SettingsRepository).save({
                key: 'features.sourceControl.sshKeys',
                value: JSON.stringify({
                    encryptedPrivateKey: this.cipher.encrypt(keyPair.privateKey),
                    publicKey: keyPair.publicKey,
                }),
                loadOnStartup: true,
            });
        }
        catch (error) {
            throw new n8n_workflow_1.ApplicationError('Failed to write key pair to database', { cause: error });
        }
        if (keyPairType !== this.getPreferences().keyGeneratorType) {
            await this.setPreferences({ keyGeneratorType: keyPairType });
        }
        return this.getPreferences();
    }
    isBranchReadOnly() {
        return this._sourceControlPreferences.branchReadOnly;
    }
    isSourceControlConnected() {
        return this.sourceControlPreferences.connected;
    }
    isSourceControlLicensedAndEnabled() {
        return this.isSourceControlConnected() && (0, source_control_helper_ee_1.isSourceControlLicensed)();
    }
    getBranchName() {
        return this.sourceControlPreferences.branchName;
    }
    getPreferences() {
        return this.sourceControlPreferences;
    }
    async validateSourceControlPreferences(preferences, allowMissingProperties = true) {
        const preferencesObject = new source_control_preferences_1.SourceControlPreferences(preferences);
        const validationResult = await (0, class_validator_1.validate)(preferencesObject, {
            forbidUnknownValues: false,
            skipMissingProperties: allowMissingProperties,
            stopAtFirstError: false,
            validationError: { target: false },
        });
        if (validationResult.length > 0) {
            throw new n8n_workflow_1.ApplicationError('Invalid source control preferences', {
                extra: { preferences: validationResult },
            });
        }
        return validationResult;
    }
    async setPreferences(preferences, saveToDb = true) {
        const noKeyPair = (await this.getKeyPairFromDatabase()) === null;
        if (noKeyPair)
            await this.generateAndSaveKeyPair();
        this.sourceControlPreferences = preferences;
        if (saveToDb) {
            const settingsValue = JSON.stringify(this._sourceControlPreferences);
            try {
                await typedi_1.default.get(settings_repository_1.SettingsRepository).save({
                    key: constants_1.SOURCE_CONTROL_PREFERENCES_DB_KEY,
                    value: settingsValue,
                    loadOnStartup: true,
                }, { transaction: false });
            }
            catch (error) {
                throw new n8n_workflow_1.ApplicationError('Failed to save source control preferences', { cause: error });
            }
        }
        return this.sourceControlPreferences;
    }
    async loadFromDbAndApplySourceControlPreferences() {
        const loadedPreferences = await typedi_1.default.get(settings_repository_1.SettingsRepository).findOne({
            where: { key: constants_1.SOURCE_CONTROL_PREFERENCES_DB_KEY },
        });
        if (loadedPreferences) {
            try {
                const preferences = (0, n8n_workflow_1.jsonParse)(loadedPreferences.value);
                if (preferences) {
                    await this.setPreferences(preferences, false);
                    return preferences;
                }
            }
            catch (error) {
                this.logger.warn(`Could not parse Source Control settings from database: ${error.message}`);
            }
        }
        await this.setPreferences(new source_control_preferences_1.SourceControlPreferences(), true);
        return this.sourceControlPreferences;
    }
};
exports.SourceControlPreferencesService = SourceControlPreferencesService;
exports.SourceControlPreferencesService = SourceControlPreferencesService = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [n8n_core_1.InstanceSettings,
        logger_service_1.Logger,
        n8n_core_1.Cipher])
], SourceControlPreferencesService);
//# sourceMappingURL=source-control-preferences.service.ee.js.map