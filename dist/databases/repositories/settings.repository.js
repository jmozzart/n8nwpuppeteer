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
exports.SettingsRepository = void 0;
const typeorm_1 = require("@n8n/typeorm");
const n8n_workflow_1 = require("n8n-workflow");
const typedi_1 = require("typedi");
const config_1 = __importDefault(require("../../config"));
const constants_1 = require("../../external-secrets/constants");
const settings_1 = require("../entities/settings");
let SettingsRepository = class SettingsRepository extends typeorm_1.Repository {
    constructor(dataSource) {
        super(settings_1.Settings, dataSource.manager);
    }
    async getEncryptedSecretsProviderSettings() {
        return (await this.findByKey(constants_1.EXTERNAL_SECRETS_DB_KEY))?.value ?? null;
    }
    async findByKey(key) {
        return await this.findOneBy({ key });
    }
    async saveEncryptedSecretsProviderSettings(data) {
        await this.upsert({
            key: constants_1.EXTERNAL_SECRETS_DB_KEY,
            value: data,
            loadOnStartup: false,
        }, ['key']);
    }
    async dismissBanner({ bannerName }) {
        const key = 'ui.banners.dismissed';
        const dismissedBannersSetting = await this.findOneBy({ key });
        try {
            let value;
            if (dismissedBannersSetting) {
                const dismissedBanners = JSON.parse(dismissedBannersSetting.value);
                const updatedValue = [...new Set([...dismissedBanners, bannerName].sort())];
                value = JSON.stringify(updatedValue);
                await this.update({ key }, { value, loadOnStartup: true });
            }
            else {
                value = JSON.stringify([bannerName]);
                await this.save({ key, value, loadOnStartup: true }, { transaction: false });
            }
            config_1.default.set(key, value);
            return { success: true };
        }
        catch (error) {
            n8n_workflow_1.ErrorReporterProxy.error(error);
        }
        return { success: false };
    }
};
exports.SettingsRepository = SettingsRepository;
exports.SettingsRepository = SettingsRepository = __decorate([
    (0, typedi_1.Service)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], SettingsRepository);
//# sourceMappingURL=settings.repository.js.map