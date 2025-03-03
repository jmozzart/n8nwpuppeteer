"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isWorkflowHistoryLicensed = isWorkflowHistoryLicensed;
exports.isWorkflowHistoryEnabled = isWorkflowHistoryEnabled;
exports.getWorkflowHistoryLicensePruneTime = getWorkflowHistoryLicensePruneTime;
exports.getWorkflowHistoryPruneTime = getWorkflowHistoryPruneTime;
const typedi_1 = __importDefault(require("typedi"));
const config_1 = __importDefault(require("../../config"));
const license_1 = require("../../license");
function isWorkflowHistoryLicensed() {
    const license = typedi_1.default.get(license_1.License);
    return license.isWorkflowHistoryLicensed();
}
function isWorkflowHistoryEnabled() {
    return isWorkflowHistoryLicensed() && config_1.default.getEnv('workflowHistory.enabled');
}
function getWorkflowHistoryLicensePruneTime() {
    return typedi_1.default.get(license_1.License).getWorkflowHistoryPruneLimit();
}
function getWorkflowHistoryPruneTime() {
    const licenseTime = typedi_1.default.get(license_1.License).getWorkflowHistoryPruneLimit();
    const configTime = config_1.default.getEnv('workflowHistory.pruneTime');
    if (licenseTime === -1) {
        return configTime;
    }
    if (configTime === -1) {
        return licenseTime;
    }
    return Math.min(configTime, licenseTime);
}
//# sourceMappingURL=workflow-history-helper.ee.js.map