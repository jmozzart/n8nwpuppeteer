"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.preferGet = exports.updateIntervalTime = void 0;
exports.isExternalSecretsEnabled = isExternalSecretsEnabled;
const config_1 = require("@n8n/config");
const typedi_1 = __importDefault(require("typedi"));
const license_1 = require("../license");
const updateIntervalTime = () => typedi_1.default.get(config_1.GlobalConfig).externalSecrets.updateInterval * 1000;
exports.updateIntervalTime = updateIntervalTime;
const preferGet = () => typedi_1.default.get(config_1.GlobalConfig).externalSecrets.preferGet;
exports.preferGet = preferGet;
function isExternalSecretsEnabled() {
    const license = typedi_1.default.get(license_1.License);
    return license.isExternalSecretsEnabled();
}
//# sourceMappingURL=external-secrets-helper.ee.js.map