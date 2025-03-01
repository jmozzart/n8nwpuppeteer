"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isVariablesEnabled = isVariablesEnabled;
exports.canCreateNewVariable = canCreateNewVariable;
exports.getVariablesLimit = getVariablesLimit;
const typedi_1 = require("typedi");
const license_1 = require("../../license");
function isVariablesEnabled() {
    const license = typedi_1.Container.get(license_1.License);
    return license.isVariablesEnabled();
}
function canCreateNewVariable(variableCount) {
    if (!isVariablesEnabled()) {
        return false;
    }
    const license = typedi_1.Container.get(license_1.License);
    const limit = license.getVariablesLimit();
    if (limit === -1) {
        return true;
    }
    return limit > variableCount;
}
function getVariablesLimit() {
    const license = typedi_1.Container.get(license_1.License);
    return license.getVariablesLimit();
}
//# sourceMappingURL=environment-helpers.js.map